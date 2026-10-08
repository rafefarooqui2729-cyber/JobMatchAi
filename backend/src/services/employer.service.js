import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import Application from '../models/application.model.js';
import Company from '../models/company.model.js';
import EmployerProfile from '../models/employer-profile.model.js';
import Job from '../models/job.model.js';
import Skill from '../models/skill.model.js';
import { emitToUser } from '../sockets/index.js';
import { SOCKET_EVENTS } from '../sockets/events.js';
import { createAndEmitNotification } from './notification.service.js';
import { calculateMatch } from './job-matching.service.js';

const uploadRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads', 'company-logos');

function normalizeSkillName(name) {
  return name
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[_\-\s]+/g, ' ')
    .replace(/[^\p{L}\p{N}+#. ]/gu, '')
    .replace(/\s+/g, ' ');
}

async function resolveSkills(names) {
  const distinct = new Map();
  for (const name of names ?? []) {
    const normalizedName = normalizeSkillName(name);
    if (!distinct.has(normalizedName)) distinct.set(normalizedName, name.trim());
  }
  const skills = [];
  for (const [normalizedName, name] of distinct) {
    let skill = await Skill.findOne({ normalizedName, isActive: true });
    if (!skill) {
      try {
        skill = await Skill.create({ name, normalizedName, category: 'other' });
      } catch (error) {
        if (error.code !== 11000) throw error;
        skill = await Skill.findOne({ normalizedName, isActive: true });
        if (!skill) throw error;
      }
    }
    skills.push(skill._id);
  }
  return skills;
}

async function employerContext(userId) {
  const profile = await EmployerProfile.findOne({ user: userId }).populate('company');
  if (!profile?.company) {
    const error = new Error('Employer company profile was not found.');
    error.statusCode = 404;
    throw error;
  }
  return profile;
}

function publicCompany(company) {
  return company.toObject({ versionKey: false });
}

async function presentJob(job) {
  await job.populate([
    { path: 'company', select: 'name slug logoUrl industry' },
    { path: 'requiredSkills', select: 'name normalizedName' },
    { path: 'preferredSkills', select: 'name normalizedName' },
  ]);
  const result = job.toObject({ versionKey: false });
  result.requiredSkills = result.requiredSkills.filter(Boolean).map(({ name }) => name);
  result.preferredSkills = result.preferredSkills.filter(Boolean).map(({ name }) => name);
  return result;
}

export async function getEmployerCompany(userId) {
  const employer = await employerContext(userId);
  return publicCompany(employer.company);
}

export async function updateEmployerCompany(userId, changes) {
  const employer = await employerContext(userId);
  const company = employer.company;
  for (const [key, value] of Object.entries(changes)) {
    company.set(key, value);
  }
  await company.save();
  return publicCompany(company);
}

export async function updateCompanyLogo(userId, file) {
  const employer = await employerContext(userId);
  const company = employer.company;
  const extensions = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
  };
  const extension = extensions[file.detectedMimeType];
  if (!extension) {
    const error = new Error('Logo must be a valid PNG, JPEG, or WebP image.');
    error.statusCode = 400;
    throw error;
  }

  await mkdir(uploadRoot, { recursive: true });
  const filename = `${company.id}-${randomUUID()}${extension}`;
  const storageKey = `company-logos/${filename}`;
  await writeFile(join(uploadRoot, filename), file.buffer, { flag: 'wx', mode: 0o640 });

  const previousKey = company.logoStorageKey;
  company.logoStorageKey = storageKey;
  company.logoUrl = `/uploads/${storageKey}`;
  try {
    await company.save();
  } catch (error) {
    await unlink(join(uploadRoot, basename(filename))).catch(() => {});
    throw error;
  }

  if (previousKey?.startsWith('company-logos/')) {
    const previousFilename = basename(previousKey);
    await unlink(join(uploadRoot, previousFilename)).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }

  return publicCompany(company);
}

export async function listEmployerJobs(userId) {
  const jobs = await Job.find({ employer: userId }).sort({ updatedAt: -1 }).limit(100);
  return Promise.all(jobs.map(presentJob));
}

export async function getEmployerJob(userId, jobId) {
  const job = await Job.findOne({ _id: jobId, employer: userId });
  return job ? presentJob(job) : null;
}

export async function createEmployerJob(userId, changes) {
  const employer = await employerContext(userId);
  const jobData = { ...changes };
  jobData.requiredSkills = await resolveSkills(changes.requiredSkills ?? []);
  jobData.preferredSkills = await resolveSkills(changes.preferredSkills ?? []);
  const job = await Job.create({
    ...jobData,
    company: employer.company._id,
    employer: userId,
    status: 'draft',
  });
  return presentJob(job);
}

export async function updateEmployerJob(userId, jobId, changes) {
  const job = await Job.findOne({ _id: jobId, employer: userId });
  if (!job) return null;

  const jobData = { ...changes };
  if (Object.hasOwn(changes, 'requiredSkills')) {
    jobData.requiredSkills = await resolveSkills(changes.requiredSkills);
  }
  if (Object.hasOwn(changes, 'preferredSkills')) {
    jobData.preferredSkills = await resolveSkills(changes.preferredSkills);
  }
  for (const [key, value] of Object.entries(jobData)) job.set(key, value);
  await job.save();
  return presentJob(job);
}

export async function deleteEmployerJob(userId, jobId) {
  const job = await Job.findOne({ _id: jobId, employer: userId }).select('_id');
  if (!job) return false;
  if (await Application.exists({ job: job._id })) {
    const error = new Error('This job has applications and cannot be deleted. Close it instead.');
    error.statusCode = 409;
    throw error;
  }
  await job.deleteOne();
  return true;
}

export async function publishEmployerJob(userId, jobId) {
  const job = await Job.findOne({ _id: jobId, employer: userId });
  if (!job) return null;
  if (job.status === 'closed') {
    const error = new Error('A closed job cannot be published.');
    error.statusCode = 409;
    throw error;
  }
  if (job.status === 'published') return presentJob(job);
  job.status = 'published';
  job.publishedAt = new Date();
  await job.save();
  return presentJob(job);
}

export async function closeEmployerJob(userId, jobId) {
  const job = await Job.findOne({ _id: jobId, employer: userId });
  if (!job) return null;
  job.status = 'closed';
  await job.save();
  return presentJob(job);
}

export async function updateEmployerApplicationStatus(userId, applicationId, status) {
  const application = await Application.findById(applicationId)
    .populate({ path: 'job', select: 'employer title' })
    .populate({ path: 'candidate', select: 'user' });
  if (!application || !application.job || !application.candidate
    || String(application.job.employer) !== String(userId)) return null;
  if (application.status === 'withdrawn') {
    const error = new Error('A withdrawn application cannot be updated.');
    error.statusCode = 409;
    throw error;
  }
  if (application.status === status) {
    return {
      candidateUserId: application.candidate.user,
      application: {
        id: application.id,
        job: String(application.job._id),
        jobTitle: application.job.title,
        status: application.status,
        statusUpdatedAt: application.statusUpdatedAt,
      },
    };
  }

  application.status = status;
  application.statusUpdatedAt = new Date();
  application.statusHistory.push({ status, changedAt: application.statusUpdatedAt, changedBy: userId });
  await application.save();
  const payload = {
    eventId: randomUUID(),
    applicationId: application.id,
    jobId: String(application.job._id),
    jobTitle: application.job.title,
    status: application.status,
    statusUpdatedAt: application.statusUpdatedAt,
  };
  await createAndEmitNotification(application.candidate.user, {
    type: 'application-status',
    title: status === 'shortlisted' ? 'You have been shortlisted' : 'Application status updated',
    message: `Your application for ${application.job.title} is now ${status.replace('-', ' ')}.`,
    resource: { type: 'application', id: application._id },
  });
  emitToUser(application.candidate.user, SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, payload);
  if (status === 'shortlisted') emitToUser(application.candidate.user, SOCKET_EVENTS.APPLICATION_SHORTLISTED, payload);
  if (status === 'rejected') emitToUser(application.candidate.user, SOCKET_EVENTS.APPLICATION_REJECTED, payload);
  return {
    candidateUserId: application.candidate.user,
    application: {
      id: application.id,
      job: String(application.job._id),
      jobTitle: application.job.title,
      status: application.status,
      statusUpdatedAt: application.statusUpdatedAt,
    },
  };
}

export async function listApplicantsForJob(userId, jobId, { status, page, limit }) {
  const job = await Job.findOne({ _id: jobId, employer: userId }).populate([
    { path: 'company', select: 'name' },
    { path: 'requiredSkills', select: 'name normalizedName' },
    { path: 'preferredSkills', select: 'name normalizedName' },
  ]);
  if (!job) return null;
  const filter = { job: job._id };
  if (status) filter.status = status;
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'candidate',
        select: 'user firstName lastName headline summary location skills education experience projects profileVisibility',
        populate: [
          { path: 'skills.skill', select: 'name normalizedName' },
          { path: 'experience.skills', select: 'name normalizedName' },
          { path: 'projects.skills', select: 'name normalizedName' },
        ],
      })
      .lean(),
    Application.countDocuments(filter),
  ]);
  const applicants = applications.map((application) => {
    const candidate = application.candidate;
    const visible = candidate?.profileVisibility === 'employers';
    const match = visible && candidate ? calculateMatch(candidate, job) : null;
    return {
      id: String(application._id),
      status: application.status,
      createdAt: application.createdAt,
      statusUpdatedAt: application.statusUpdatedAt,
      statusHistory: (application.statusHistory ?? []).map(({ status: itemStatus, changedAt }) => ({
        status: itemStatus,
        changedAt,
      })),
      matchScore: application.matchScore,
      match,
      candidate: visible && candidate ? {
        id: String(candidate._id),
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        headline: candidate.headline,
        summary: candidate.summary,
        location: candidate.location,
        skills: (candidate.skills ?? []).filter(({ skill }) => skill).map(({ skill }) => skill.name),
        education: candidate.education,
        experience: candidate.experience.map(({ skills, ...entry }) => ({
          ...entry,
          technologies: (skills ?? []).filter(Boolean).map(({ name }) => name),
        })),
        projects: candidate.projects.map(({ skills, ...entry }) => ({
          ...entry,
          technologies: (skills ?? []).filter(Boolean).map(({ name }) => name),
        })),
      } : { id: candidate ? String(candidate._id) : null, profileVisible: false },
      hasResume: Boolean(application.resume && visible),
    };
  });
  return {
    job: { id: String(job._id), title: job.title, company: job.company?.name ?? '' },
    applicants,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getEmployerApplication(userId, applicationId) {
  const application = await Application.findById(applicationId)
    .populate({ path: 'job', select: 'employer title' })
    .populate({ path: 'candidate', select: 'firstName lastName headline location profileVisibility' });
  if (!application?.job || String(application.job.employer) !== String(userId)) return null;
  const candidate = application.candidate;
  const visible = candidate?.profileVisibility === 'employers';
  return {
    id: application.id,
    status: application.status,
    createdAt: application.createdAt,
    statusUpdatedAt: application.statusUpdatedAt,
    statusHistory: (application.statusHistory ?? []).map(({ status, changedAt }) => ({ status, changedAt })),
    matchScore: application.matchScore,
    candidate: visible ? {
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      headline: candidate.headline,
      location: candidate.location,
    } : { id: candidate?.id ?? null, profileVisible: false },
    job: { id: application.job.id, title: application.job.title },
    hasResume: Boolean(application.resume && visible),
  };
}

export function imageMimeFromBytes(buffer) {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'image/png';
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return 'image/jpeg';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp';
  return null;
}
