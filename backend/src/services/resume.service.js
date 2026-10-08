import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import CandidateProfile from '../models/candidate-profile.model.js';
import Resume from '../models/resume.model.js';
import Application from '../models/application.model.js';
import {
  FIELD_CONFIDENCE_THRESHOLD,
  RESUME_PARSER_VERSION,
  parseResumeText,
} from './resume-parser.service.js';
import {
  extractResumeText,
  RESUME_MIME_TYPES,
} from './resume-extraction.service.js';
import {
  getCandidateProfile,
  normalizeSkillName,
  updateCandidateProfile,
} from './candidate-profile.service.js';

const storageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'private-uploads', 'resumes');
const ALLOWED_EXTENSIONS = new Map([
  ['.pdf', RESUME_MIME_TYPES.pdf],
  ['.docx', RESUME_MIME_TYPES.docx],
]);

function invalidUpload(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function safeOriginalName(value) {
  const name = String(value ?? '')
    .replace(/^.*[\\/]/, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 255);
  return name || 'resume';
}

function isConfident(entry) {
  return entry?.value && entry.confidence >= FIELD_CONFIDENCE_THRESHOLD;
}

function normalizedKey(value) {
  return typeof value === 'string' ? normalizeSkillName(value) : '';
}

function mergeDistinct(existing, additions, keyOf) {
  const result = [...existing];
  const keys = new Set(existing.map(keyOf).filter(Boolean));
  for (const item of additions) {
    const key = keyOf(item);
    if (key && !keys.has(key)) {
      keys.add(key);
      result.push(item);
    }
  }
  return result;
}

function existingSkills(profile) {
  return profile.skills
    .filter(({ skill }) => skill)
    .map(({ skill, proficiency, yearsExperience }) => ({
      name: skill.name,
      proficiency,
      yearsExperience,
    }));
}

function existingExperience(profile) {
  return profile.experience.map((entry) => ({
    _id: entry._id,
    employer: entry.employer,
    title: entry.title,
    location: entry.location,
    startDate: entry.startDate?.toISOString?.().slice(0, 10),
    endDate: entry.endDate?.toISOString?.().slice(0, 10),
    isCurrent: entry.isCurrent,
    description: entry.description,
    technologies: entry.skills.filter(Boolean).map(({ name }) => name),
  }));
}

function existingProjects(profile) {
  return profile.projects.map((entry) => ({
    _id: entry._id,
    name: entry.name,
    description: entry.description,
    url: entry.url,
    githubUrl: entry.githubUrl,
    technologies: entry.skills.filter(Boolean).map(({ name }) => name),
  }));
}

function profileChanges(profile, parsed) {
  const changes = {};
  if (!profile.phone && isConfident(parsed.fields.phone)) {
    changes.phone = parsed.fields.phone.value;
  }

  const skills = parsed.skills
    .filter((skill) => skill.confidence >= FIELD_CONFIDENCE_THRESHOLD)
    .map(({ name }) => name);
  if (skills.length) {
    changes.skills = mergeDistinct(existingSkills(profile), skills, (entry) => normalizedKey(
      typeof entry === 'string' ? entry : entry.name,
    ));
  }

  const education = parsed.education
    .filter(isConfident)
    .map(({ value }) => value);
  if (education.length) {
    changes.education = mergeDistinct(
      profile.education.map((entry) => entry.toObject()),
      education,
      (entry) => `${normalizedKey(entry.institution)}:${normalizedKey(entry.degree || entry.level)}`,
    );
  }

  const experience = parsed.experience
    .filter(isConfident)
    .map(({ value }) => value);
  if (experience.length) {
    changes.experience = mergeDistinct(
      existingExperience(profile),
      experience,
      (entry) => `${normalizedKey(entry.employer)}:${normalizedKey(entry.title)}:${String(entry.startDate ?? '').slice(0, 10)}`,
    );
  }

  const projects = parsed.projects
    .filter(isConfident)
    .map(({ value }) => value);
  if (projects.length) {
    changes.projects = mergeDistinct(
      existingProjects(profile),
      projects,
      (entry) => normalizedKey(entry.name),
    );
  }

  const certifications = parsed.certifications
    .filter(isConfident)
    .map(({ value }) => value);
  if (certifications.length) {
    changes.certifications = mergeDistinct(
      profile.certifications.map((entry) => entry.toObject()),
      certifications,
      (entry) => normalizedKey(entry.name),
    );
  }
  return changes;
}

function publicResume(resume) {
  return {
    id: resume.id,
    originalName: resume.originalName,
    mimeType: resume.mimeType,
    sizeBytes: resume.sizeBytes,
    status: resume.status,
    parserVersion: resume.parserVersion,
    parsedAt: resume.parsedAt,
    createdAt: resume.createdAt,
    extractedSkills: (resume.extractedSkills ?? [])
      .filter(({ skill }) => skill)
      .map(({ skill, confidence }) => ({ name: skill.name, confidence })),
  };
}

function resumeDownload(resume) {
  if (
    typeof resume.storageKey !== 'string' ||
    basename(resume.storageKey) !== resume.storageKey ||
    !/^[a-f0-9-]{36}\.(pdf|docx)$/i.test(resume.storageKey)
  ) return null;
  return {
    path: join(storageRoot, resume.storageKey),
    originalName: safeOriginalName(resume.originalName),
    mimeType: resume.mimeType,
  };
}

async function existingDownload(resume) {
  const download = resumeDownload(resume);
  if (!download) return null;
  try {
    await access(download.path);
    return download;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function getOwnResumeDownload(userId) {
  const profile = await CandidateProfile.findOne({ user: userId }).select('_id');
  if (!profile) return null;
  const resume = await Resume.findOne({ candidate: profile._id, user: userId, isPrimary: true });
  return resume ? existingDownload(resume) : null;
}

export async function getApplicantResumeDownload(employerId, applicationId) {
  const application = await Application.findById(applicationId)
    .populate({ path: 'job', select: 'employer' })
    .populate({ path: 'candidate', select: 'profileVisibility' });
  if (
    !application?.job ||
    String(application.job.employer) !== String(employerId) ||
    application.candidate?.profileVisibility !== 'employers' ||
    !application.resume
  ) return null;
  const resume = await Resume.findOne({
    _id: application.resume,
    candidate: application.candidate._id,
  });
  return resume ? existingDownload(resume) : null;
}

export async function getCandidateApplicationResumeDownload(userId, applicationId) {
  const profile = await CandidateProfile.findOne({ user: userId }).select('_id');
  if (!profile) return null;
  const application = await Application.findOne({
    _id: applicationId,
    candidate: profile._id,
  }).select('resume candidate');
  if (!application?.resume) return null;
  const resume = await Resume.findOne({
    _id: application.resume,
    candidate: profile._id,
  });
  return resume ? existingDownload(resume) : null;
}

export async function getCandidateResume(userId) {
  const profile = await CandidateProfile.findOne({ user: userId }).select('_id');
  if (!profile) return null;
  const resume = await Resume.findOne({ candidate: profile._id, isPrimary: true })
    .populate('extractedSkills.skill', 'name');
  return resume ? publicResume(resume) : null;
}

export async function uploadAndParseResume(userId, file) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.size < 1) {
    throw invalidUpload('Choose a non-empty PDF or DOCX resume.');
  }
  const originalName = safeOriginalName(file.originalname);
  const extension = extname(originalName).toLocaleLowerCase('en');
  const expectedMimeType = ALLOWED_EXTENSIONS.get(extension);
  if (!expectedMimeType || file.mimetype !== expectedMimeType) {
    throw invalidUpload('Resume file extension and type must match a PDF or DOCX document.');
  }

  const profile = await CandidateProfile.findOne({ user: userId });
  if (!profile) {
    const error = new Error('Candidate profile was not found.');
    error.statusCode = 404;
    throw error;
  }

  await mkdir(storageRoot, { recursive: true });
  const storageKey = `${randomUUID()}${extension}`;
  const storagePath = join(storageRoot, storageKey);
  try {
    await writeFile(storagePath, file.buffer, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      try {
        await unlink(storagePath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          throw new AggregateError([error, cleanupError], 'Resume storage failed and the partial file could not be removed.');
        }
      }
    }
    throw error;
  }

  const resume = new Resume({
    candidate: profile._id,
    user: userId,
    storageKey,
    originalName,
    mimeType: expectedMimeType,
    sizeBytes: file.size,
    sha256: createHash('sha256').update(file.buffer).digest('hex'),
    status: 'processing',
    parserVersion: RESUME_PARSER_VERSION,
    isPrimary: false,
  });
  let previousPrimary;

  try {
    await resume.save();
    const text = await extractResumeText(file.buffer, expectedMimeType);
    const parsed = parseResumeText(text);
    const populatedProfile = await CandidateProfile.findById(profile._id).populate([
      { path: 'skills.skill', select: 'name' },
      { path: 'experience.skills', select: 'name' },
      { path: 'projects.skills', select: 'name' },
    ]);
    const changes = profileChanges(populatedProfile, parsed);
    let updatedProfile = Object.keys(changes).length
      ? await updateCandidateProfile(userId, changes)
      : await getCandidateProfile(userId);

    const extractedSkillConfidence = new Map(
      parsed.skills
        .filter((skill) => skill.confidence >= FIELD_CONFIDENCE_THRESHOLD)
        .map(({ name, confidence }) => [normalizeSkillName(name), confidence]),
    );
    const currentProfile = await CandidateProfile.findById(profile._id)
      .populate('skills.skill', 'name normalizedName');
    const skillIds = currentProfile.skills
      .filter(({ skill }) => skill && extractedSkillConfidence.has(normalizeSkillName(skill.name)))
      .map(({ skill }) => ({
        skill: skill._id,
        confidence: extractedSkillConfidence.get(normalizeSkillName(skill.name)),
      }));

    previousPrimary = await Resume.findOne({ candidate: profile._id, isPrimary: true });
    if (previousPrimary) {
      previousPrimary.isPrimary = false;
      await previousPrimary.save();
    }
    resume.status = 'processed';
    resume.isPrimary = true;
    resume.parsedAt = new Date();
    resume.extractedSkills = skillIds;
    await resume.save();

    try {
      const candidate = await CandidateProfile.findById(profile._id);
      candidate.resume = resume._id;
      await candidate.save();
      updatedProfile.resume = resume.id;
    } catch (error) {
      resume.isPrimary = false;
      await resume.save();
      if (previousPrimary) {
        previousPrimary.isPrimary = true;
        await previousPrimary.save();
      }
      throw error;
    }

    return {
      resume: publicResume(await Resume.findById(resume._id).populate('extractedSkills.skill', 'name')),
      parsed,
      profile: updatedProfile,
    };
  } catch (error) {
    const cleanupErrors = [];
    try {
      await Resume.deleteOne({ _id: resume._id });
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    if (previousPrimary && !previousPrimary.isPrimary) {
      previousPrimary.isPrimary = true;
      try {
        await previousPrimary.save();
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    try {
      await unlink(storagePath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') cleanupErrors.push(cleanupError);
    }
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        'Resume processing failed and cleanup did not complete successfully.',
      );
    }
    throw error;
  }
}
