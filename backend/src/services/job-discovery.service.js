import Job from '../models/job.model.js';
import Skill from '../models/skill.model.js';
import { normalizeSkillName } from './job-matching.service.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveSkillIds(skillNames) {
  if (!skillNames.length) return [];

  const normalized = skillNames.map((name) =>
    name
      .normalize('NFKC')
      .trim()
      .toLocaleLowerCase('en')
      .replace(/[_\-\s]+/g, ' ')
      .replace(/[^\p{L}\p{N}+#. ]/gu, '')
      .replace(/\s+/g, ' '),
  );

  const canonical = normalized.map(normalizeSkillName);

  const skills = await Skill.find({
    isActive: true,
    $or: [
      { normalizedName: { $in: normalized } },
      { aliases: { $in: normalized } },
      { normalizedName: { $in: canonical } },
      { aliases: { $in: canonical } },
    ],
  }).select('_id');

  return skills.map(({ _id }) => _id);
}

async function buildSearchQuery(filters) {
  const query = { status: 'published' };
  const and = [];

  if (filters.q) {
    query.$text = { $search: filters.q };
  }

  if (filters.title) {
    query.title = {
      $regex: escapeRegex(filters.title),
      $options: 'i',
    };
  }

  if (filters.location) {
    const locationRegex = new RegExp(
      escapeRegex(filters.location),
      'i',
    );

    and.push({
      $or: [
        { 'location.city': locationRegex },
        { 'location.region': locationRegex },
        { 'location.country': locationRegex },
      ],
    });
  }

  if (filters.employmentType) {
    query.employmentType = filters.employmentType;
  }

  if (filters.skill.length) {
    const ids = await resolveSkillIds(filters.skill);

    if (!ids.length) {
      query._id = null;
    } else {
      and.push({
        $or: [
          { requiredSkills: { $in: ids } },
          { preferredSkills: { $in: ids } },
        ],
      });
    }
  }

  if (filters.minExperience !== undefined) {
    and.push({
      $or: [
        {
          maximumExperience: {
            $gte: filters.minExperience,
          },
        },
        {
          maximumExperience: null,
        },
      ],
    });
  }

  if (filters.maxExperience !== undefined) {
    and.push({
      minimumExperience: {
        $lte: filters.maxExperience,
      },
    });
  }

  if (filters.minSalary !== undefined) {
    and.push({
      'salary.maximum': {
        $gte: filters.minSalary,
      },
    });
  }

  if (filters.maxSalary !== undefined) {
    and.push({
      'salary.minimum': {
        $lte: filters.maxSalary,
      },
    });
  }

  if (filters.salaryCurrency) {
    query['salary.currency'] = filters.salaryCurrency;
  }

  if (
    filters.minSalary !== undefined ||
    filters.maxSalary !== undefined
  ) {
    and.push({
      'salary.isDisclosed': {
        $ne: false,
      },
    });
  }

  if (and.length) {
    query.$and = and;
  }

  return query;
}

function sortFor(filters) {
  if (filters.sort === 'salary') {
    return {
      'salary.maximum': -1,
      'salary.minimum': -1,
      publishedAt: -1,
      _id: -1,
    };
  }

  if (filters.sort === 'relevance') {
    return {
      score: { $meta: 'textScore' },
      publishedAt: -1,
      _id: -1,
    };
  }

  return {
    publishedAt: -1,
    _id: -1,
  };
}

function publicJob(job) {
  const record =
    typeof job.toObject === 'function'
      ? job.toObject({ versionKey: false })
      : { ...job };

  record.requiredSkills = (record.requiredSkills ?? [])
    .filter(Boolean)
    .map(({ name }) => name);

  record.preferredSkills = (record.preferredSkills ?? [])
    .filter(Boolean)
    .map(({ name }) => name);

  return record;
}

/*
 * IMPORTANT:
 *
 * These fields are required for external jobs.
 *
 * Without them, the backend removes the external-job
 * information before sending the job to the frontend.
 */
const searchProjection = [
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

  'publishedAt',
  'createdAt',
  'updatedAt',

  /*
   * External job fields
   */
  'source',
  'provider',
  'sourceJobId',
  'sourceUrl',
  'externalApplyUrl',
  'isExternal',
  'lastSyncedAt',
  'externalExpiresAt',
];

export async function searchPublishedJobs(filters) {
  const query = await buildSearchQuery(filters);

  const total = await Job.countDocuments(query);

  const totalPages = Math.max(
    1,
    Math.ceil(total / filters.limit),
  );

  const page = Math.min(
    filters.page,
    totalPages,
  );

  const projection = Object.fromEntries(
    searchProjection.map((field) => [
      field,
      1,
    ]),
  );

  if (filters.sort === 'relevance') {
    projection.score = {
      $meta: 'textScore',
    };
  }

  const jobs = await Job.find(
    query,
    projection,
  )
    .sort(sortFor(filters))
    .skip((page - 1) * filters.limit)
    .limit(filters.limit)
    .populate([
      {
        path: 'company',
        select:
          'name slug logoUrl industry website headquarters',
      },
      {
        path: 'requiredSkills',
        select: 'name normalizedName',
      },
      {
        path: 'preferredSkills',
        select: 'name normalizedName',
      },
    ])
    .lean();

  return {
    jobs: jobs.map((job) => ({
      ...job,

      requiredSkills:
        (job.requiredSkills ?? [])
          .filter(Boolean)
          .map(({ name }) => name),

      preferredSkills:
        (job.preferredSkills ?? [])
          .filter(Boolean)
          .map(({ name }) => name),
    })),

    pagination: {
      page,
      limit: filters.limit,
      total,
      totalPages,
      hasNextPage:
        page < totalPages,
      hasPreviousPage:
        page > 1,
    },

    sort: filters.sort,
  };
}

export async function getPublishedJob(jobId) {
  const job = await Job.findOne({
    _id: jobId,
    status: 'published',
  })
    .select(searchProjection.join(' '))
    .populate([
      {
        path: 'company',
        select:
          'name slug logoUrl industry website headquarters description size',
      },
      {
        path: 'requiredSkills',
        select: 'name normalizedName',
      },
      {
        path: 'preferredSkills',
        select: 'name normalizedName',
      },
    ]);

  return job
    ? publicJob(job)
    : null;
}