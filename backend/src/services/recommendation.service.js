
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import Application from '../models/application.model.js';
import CandidateProfile from '../models/candidate-profile.model.js';
import Job from '../models/job.model.js';
import SavedJob from '../models/saved-job.model.js';
import {
  calculateMatch,
  normalizeSkillName,
} from './job-matching.service.js';
import { emitToUser } from '../sockets/index.js';
import { SOCKET_EVENTS } from '../sockets/events.js';
import { createAndEmitNotification } from './notification.service.js';

const RECOMMENDATION_LIMIT = 50;

const CANDIDATE_POPULATE = [
  { path: 'skills.skill', select: 'name normalizedName' },
  { path: 'experience.skills', select: 'name normalizedName' },
  { path: 'projects.skills', select: 'name normalizedName' },
];

const JOB_POPULATE = [
  {
    path: 'company',
    select: 'name slug logoUrl industry website headquarters description',
  },
  { path: 'requiredSkills', select: 'name normalizedName' },
  { path: 'preferredSkills', select: 'name normalizedName' },
];

const RECOMMENDATION_JOB_FIELDS = [
  'title',
  'description',
  'company',
  'companyName',
  'location',
  'employmentType',
  'salary',
  'requiredSkills',
  'preferredSkills',
  'minimumExperience',
  'maximumExperience',
  'educationRequirements',
  'responsibilities',
  'status',
  'publishedAt',
  'expiresAt',
  'applicationDeadline',
  'createdAt',
  'updatedAt',
  'source',
  'provider',
  'sourceJobId',
  'sourceUrl',
  'externalApplyUrl',
  'isExternal',
  'lastSyncedAt',
  'externalExpiresAt',
];

const RECOMMENDATION_JOB_SELECT =
  RECOMMENDATION_JOB_FIELDS.join(' ');

function missingCandidate() {
  const error = new Error('Candidate profile was not found.');
  error.statusCode = 404;
  return error;
}

function activeJobFilter(now = new Date()) {
  return {
    status: 'published',
    $and: [
      {
        $or: [
          { applicationDeadline: null },
          { applicationDeadline: { $gt: now } },
        ],
      },
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
    ],
  };
}

function jobSnapshot(job) {
  const record = { ...job };

  delete record.employer;
  delete record.__v;

  record.requiredSkills = (record.requiredSkills ?? [])
    .filter(Boolean)
    .map((skill) =>
      typeof skill === 'string' ? skill : skill.name,
    );

  record.preferredSkills = (record.preferredSkills ?? [])
    .filter(Boolean)
    .map((skill) =>
      typeof skill === 'string' ? skill : skill.name,
    );

  return record;
}

function titlePreferenceScore(candidate, job) {
  const titles = (candidate.preferredRoles ?? [])
    .map((value) => normalizeSkillName(value))
    .filter(Boolean);

  if (!titles.length) return 0;

  const title = normalizeSkillName(job.title);

  return titles.reduce((best, preferred) => {
    if (title === preferred) return 2;

    if (
      title.includes(preferred) ||
      preferred.includes(title)
    ) {
      return Math.max(best, 1);
    }

    return best;
  }, 0);
}

function compareRecommendations(left, right) {
  return (
    right.overallScore - left.overallScore ||
    right.matchedRequiredCount - left.matchedRequiredCount ||
    right.titlePreference - left.titlePreference ||
    new Date(
      right.job.publishedAt ?? right.job.createdAt ?? 0,
    ).getTime() -
      new Date(
        left.job.publishedAt ?? left.job.createdAt ?? 0,
      ).getTime() ||
    String(right.job._id).localeCompare(String(left.job._id))
  );
}

function addTopRecommendation(top, recommendation, limit) {
  let index = 0;

  while (
    index < top.length &&
    compareRecommendations(top[index], recommendation) <= 0
  ) {
    index += 1;
  }

  top.splice(index, 0, recommendation);

  if (top.length > limit) {
    top.pop();
  }
}

async function currentCandidate(userId) {
  const profile = await CandidateProfile.findOne({
    user: userId,
  }).populate(CANDIDATE_POPULATE);

  if (!profile) {
    throw missingCandidate();
  }

  return profile;
}

function matchedRequiredCount(candidate, job, match) {
  const matched = new Set(
    match.matchedSkills.map(normalizeSkillName),
  );

  return (job.requiredSkills ?? []).filter((skill) =>
    matched.has(
      normalizeSkillName(skill?.name ?? skill),
    ),
  ).length;
}

function pagination(limit, total) {
  return {
    limit,
    total,
    hasMore: total > limit,
  };
}

async function includeCandidateActions(candidateId, recommendations) {
  const jobIds = recommendations.map(({ job }) => job._id);

  if (!jobIds.length) {
    return recommendations;
  }

  const [saved, applied] = await Promise.all([
    SavedJob.find({
      candidate: candidateId,
      job: { $in: jobIds },
    })
      .select('job')
      .lean(),

    Application.find({
      candidate: candidateId,
      job: { $in: jobIds },
      status: { $ne: 'withdrawn' },
    })
      .select('job')
      .lean(),
  ]);

  const savedIds = new Set(
    saved.map(({ job }) => String(job)),
  );

  const appliedIds = new Set(
    applied.map(({ job }) => String(job)),
  );

  return recommendations.map((recommendation) => ({
    ...recommendation,
    isSaved: savedIds.has(String(recommendation.job._id)),
    hasApplied: appliedIds.has(String(recommendation.job._id)),
  }));
}

export async function getRecommendations(
  userId,
  requestedLimit = 20,
) {
  const limit = Math.min(
    RECOMMENDATION_LIMIT,
    Math.max(1, requestedLimit),
  );

  const candidate = await currentCandidate(userId);

  // TEMPORARY DIAGNOSTICS: log counts and collection metadata only.
  // Never log the MongoDB URI, credentials, or candidate information.
  const [totalJobs, publishedJobs, activeJobs] =
    await Promise.all([
      Job.countDocuments({}),
      Job.countDocuments({ status: 'published' }),
      Job.countDocuments(activeJobFilter()),
    ]);

  console.log('[Recommendation diagnostics]', {
    database: mongoose.connection.name,
    collection: Job.collection.name,
    totalJobs,
    publishedJobs,
    activeJobs,
  });

  const query = Job.find(activeJobFilter())
    .select(RECOMMENDATION_JOB_SELECT)
    .lean()
    .cursor({ batchSize: 200 });

  const top = [];
  let eligibleCount = 0;
  let batch = [];

  async function scoreBatch(jobs) {
    const populatedJobs = await Job.populate(
      jobs,
      JOB_POPULATE,
    );

    for (const job of populatedJobs) {
      eligibleCount += 1;

      const match = calculateMatch(candidate, job);

      addTopRecommendation(
        top,
        {
          job: jobSnapshot(job),
          ...match,
          matchedRequiredCount:
            matchedRequiredCount(candidate, job, match),
          titlePreference:
            titlePreferenceScore(candidate, job),
        },
        limit,
      );
    }
  }

  for await (const job of query) {
    batch.push(job);

    if (batch.length >= 200) {
      await scoreBatch(batch);
      batch = [];
    }
  }

  if (batch.length) {
    await scoreBatch(batch);
  }

  const ranked = top.map(
    ({
      matchedRequiredCount: _matchedRequiredCount,
      titlePreference: _titlePreference,
      ...item
    }) => item,
  );

  return {
    recommendations: await includeCandidateActions(
      candidate._id,
      ranked,
    ),
    pagination: pagination(limit, eligibleCount),
    generatedAt: new Date(),
  };
}

export async function emitUpdatedRecommendations(
  userId,
  trigger = 'profile',
) {
  const result = await getRecommendations(userId);

  emitToUser(
    userId,
    SOCKET_EVENTS.RECOMMENDATIONS_UPDATED,
    {
      eventId: randomUUID(),
      trigger,
      generatedAt: result.generatedAt,
      recommendations: result.recommendations,
      total: result.pagination.total,
    },
  );

  return result;
}

export async function notifyCandidatesOfPublishedJob(jobId) {
  const job = await Job.findOne({
    _id: jobId,
    ...activeJobFilter(),
  })
    .select(RECOMMENDATION_JOB_SELECT)
    .populate(JOB_POPULATE)
    .lean();

  if (!job) return;

  const candidates = CandidateProfile.find({})
    .select('user')
    .lean()
    .cursor({ batchSize: 100 });

  let batch = [];

  async function processCandidates(records) {
    await Promise.all(
      records.map(async ({ user }) => {
        const result = await getRecommendations(user);

        const recommendation = result.recommendations.find(
          ({ job: item }) => String(item._id) === String(job._id),
        );

        if (!recommendation) return;

        const companyName =
          job.company?.name ?? job.companyName ?? 'a company';

        await createAndEmitNotification(user, {
          type: 'job-match',
          title: 'A new role matches your profile',
          message:
            `${job.title} at ${companyName} ` +
            'has been added to your recommendations.',
          resource: {
            type: 'job',
            id: job._id,
          },
        });

        emitToUser(user, SOCKET_EVENTS.JOB_MATCHED, {
          eventId: randomUUID(),
          recommendation,
          generatedAt: result.generatedAt,
        });

        emitToUser(
          user,
          SOCKET_EVENTS.RECOMMENDATIONS_UPDATED,
          {
            eventId: randomUUID(),
            trigger: 'new-job',
            generatedAt: result.generatedAt,
            recommendations: result.recommendations,
            total: result.pagination.total,
          },
        );
      }),
    );
  }

  for await (const candidate of candidates) {
    batch.push(candidate);

    if (batch.length >= 8) {
      await processCandidates(batch);
      batch = [];
    }
  }

  if (batch.length) {
    await processCandidates(batch);
  }
}

let recommendationJobQueue = Promise.resolve();

export function schedulePublishedJobRecommendations(jobId) {
  recommendationJobQueue = recommendationJobQueue
    .then(() => notifyCandidatesOfPublishedJob(jobId))
    .catch((error) => {
      console.error(
        'Published-job recommendation processing failed.',
        {
          jobId: String(jobId),
          name: error.name,
          message: error.message,
        },
      );
    });
}

export async function getJobMatchDetails(userId, jobId) {
  const candidate = await currentCandidate(userId);

  const job = await Job.findOne({
    _id: jobId,
    ...activeJobFilter(),
  })
    .select(RECOMMENDATION_JOB_SELECT)
    .populate(JOB_POPULATE)
    .lean();

  if (!job) return null;

  const match = calculateMatch(candidate, job);

  const recommendation = {
    job: jobSnapshot(job),
    ...match,
  };

  const [saved, applied] = await Promise.all([
    SavedJob.exists({
      candidate: candidate._id,
      job: job._id,
    }),

    Application.exists({
      candidate: candidate._id,
      job: job._id,
      status: { $ne: 'withdrawn' },
    }),
  ]);

  return {
    ...recommendation,
    isSaved: Boolean(saved),
    hasApplied: Boolean(applied),
  };
}

export async function saveJobForCandidate(userId, jobId) {
  const candidate = await currentCandidate(userId);

  const job = await Job.exists({
    _id: jobId,
    ...activeJobFilter(),
  });

  if (!job) return null;

  try {
    await SavedJob.create({
      candidate: candidate._id,
      job: jobId,
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  return { saved: true };
}

export async function listSavedJobsForCandidate(
  userId,
  { page = 1, limit = 20 } = {},
) {
  const candidate = await currentCandidate(userId);
  const filter = { candidate: candidate._id };

  const [records, total] = await Promise.all([
    SavedJob.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'job',
        populate: [
          {
            path: 'company',
            select: 'name slug logoUrl industry',
          },
          {
            path: 'requiredSkills',
            select: 'name',
          },
          {
            path: 'preferredSkills',
            select: 'name',
          },
        ],
      })
      .lean(),

    SavedJob.countDocuments(filter),
  ]);

  return {
    savedJobs: records
      .filter(({ job }) => job)
      .map(({ job, createdAt }) => ({
        job: jobSnapshot(job),
        savedAt: createdAt,
        isActive:
          job.status === 'published' &&
          (!job.applicationDeadline ||
            new Date(job.applicationDeadline) > new Date()) &&
          (!job.expiresAt ||
            new Date(job.expiresAt) > new Date()),
      })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function listApplicationsForCandidate(userId) {
  const candidate = await currentCandidate(userId);

  const applications = await Application.find({
    candidate: candidate._id,
  })
    .sort({ createdAt: -1, _id: -1 })
    .populate({
      path: 'job',
      populate: [
        {
          path: 'company',
          select: 'name slug logoUrl industry',
        },
        {
          path: 'requiredSkills',
          select: 'name',
        },
        {
          path: 'preferredSkills',
          select: 'name',
        },
      ],
    })
    .lean();

  return applications
    .filter(({ job }) => job)
    .map((application) => ({
      id: String(application._id),
      status: application.status,
      statusUpdatedAt: application.statusUpdatedAt,
      statusHistory: (application.statusHistory ?? []).map(
        ({ status, changedAt }) => ({ status, changedAt }),
      ),
      matchScore: application.matchScore,
      createdAt: application.createdAt,
      job: jobSnapshot(application.job),
    }));
}

export async function getCandidateApplication(userId, applicationId) {
  const candidate = await currentCandidate(userId);

  const application = await Application.findOne({
    _id: applicationId,
    candidate: candidate._id,
  })
    .populate({
      path: 'job',
      populate: [
        {
          path: 'company',
          select: 'name slug logoUrl industry',
        },
        {
          path: 'requiredSkills',
          select: 'name',
        },
        {
          path: 'preferredSkills',
          select: 'name',
        },
      ],
    })
    .lean();

  if (!application?.job) return null;

  return {
    id: String(application._id),
    status: application.status,
    statusUpdatedAt: application.statusUpdatedAt,
    statusHistory: (application.statusHistory ?? []).map(
      ({ status, changedAt }) => ({ status, changedAt }),
    ),
    matchScore: application.matchScore,
    createdAt: application.createdAt,
    job: jobSnapshot(application.job),
    hasResume: Boolean(application.resume),
  };
}

export async function unsaveJobForCandidate(userId, jobId) {
  const candidate = await currentCandidate(userId);

  await SavedJob.deleteOne({
    candidate: candidate._id,
    job: jobId,
  });

  return { saved: false };
}

export async function applyForJob(userId, jobId) {
  const candidate = await currentCandidate(userId);

  const job = await Job.findOne({
    _id: jobId,
    ...activeJobFilter(),
  })
    .select(`
      _id
      source
      provider
      employer
      title
      description
      location
      requiredSkills
      preferredSkills
      minimumExperience
      maximumExperience
      educationRequirements
      responsibilities
      externalApplyUrl
      companyName
    `)
    .populate(JOB_POPULATE)
    .lean();

  if (!job) return null;

  // External jobs belong to another job platform.
  // Do not create a local Application for them.
  if (job.source === 'external') {
    if (!job.externalApplyUrl) {
      const error = new Error(
        'This external job does not have an application link.',
      );
      error.statusCode = 409;
      throw error;
    }

    const match = calculateMatch(candidate, job);

    return {
      external: true,
      externalApplyUrl: job.externalApplyUrl,
      matchScore: match.overallScore,
      jobId: String(job._id),
    };
  }

  // Platform jobs use the normal local application workflow.
  const match = calculateMatch(candidate, job);

  try {
    const application = await Application.create({
      candidate: candidate._id,
      job: job._id,
      matchScore: match.overallScore,
      resume: candidate.resume ?? null,
      statusHistory: [
        {
          status: 'submitted',
          changedBy: userId,
        },
      ],
    });

    await createAndEmitNotification(job.employer, {
      type: 'new-application',
      title: 'New job application',
      message: `A candidate applied for ${job.title}.`,
      resource: {
        type: 'application',
        id: application._id,
      },
    });

    emitToUser(job.employer, SOCKET_EVENTS.NEW_APPLICATION, {
      eventId: randomUUID(),
      applicationId: application.id,
      candidateId: String(candidate._id),
      jobId: String(job._id),
      jobTitle: job.title,
      status: application.status,
      matchScore: application.matchScore,
      createdAt: application.createdAt,
    });

    return {
      external: false,
      id: application.id,
      status: application.status,
      matchScore: application.matchScore,
    };
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error(
        'You have already applied to this job.',
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}
