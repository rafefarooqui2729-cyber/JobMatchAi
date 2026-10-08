import Job from '../models/job.model.js';
import Skill from '../models/skill.model.js';
import { himalayasProvider } from '../providers/himalayas.provider.js';

/* =========================================================
   HELPERS
========================================================= */

/**
 * Convert a skill name into the normalized format
 * used by the Skill model.
 *
 * Example:
 * JavaScript -> javascript
 * React.js   -> react.js
 */
function normalizeSkillName(name) {
  if (typeof name !== 'string') {
    return null;
  }

  const cleaned = name.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.toLowerCase();
}

/**
 * Find an existing Skill or create it if it does not exist.
 *
 * We use normalizedName because the Skill model has a
 * unique index on this field.
 */
async function getOrCreateSkill(skillName) {
  const normalizedName =
    normalizeSkillName(skillName);

  if (!normalizedName) {
    return null;
  }

  /* -------------------------------------------------------
     Try to find an existing skill
  ------------------------------------------------------- */

  const existingSkill = await Skill.findOne({
    $or: [
      { normalizedName },
      { aliases: normalizedName },
    ],
  });

  if (existingSkill) {
    return existingSkill;
  }

  /* -------------------------------------------------------
     Create a new skill
  ------------------------------------------------------- */

  try {
    return await Skill.create({
      name: skillName.trim(),
      normalizedName,
      category: 'technical',
      aliases: [],
      isActive: true,
    });
  } catch (error) {
    /*
     Another sync operation may have created the same
     skill between findOne() and create().
     
     Because normalizedName is unique, MongoDB can throw
     a duplicate-key error. In that case, fetch it again.
    */

    if (error?.code === 11000) {
      const skill = await Skill.findOne({
        normalizedName,
      });

      if (skill) {
        return skill;
      }
    }

    throw error;
  }
}

/**
 * Convert an array of skill names into MongoDB Skill IDs.
 */
async function resolveSkillIds(skillNames = []) {
  if (!Array.isArray(skillNames)) {
    return [];
  }

  const skillIds = [];

  for (const skillName of skillNames) {
    const skill = await getOrCreateSkill(skillName);

    if (skill) {
      skillIds.push(skill._id);
    }
  }

  return skillIds;
}

/**
 * Convert provider employment types into the enum
 * used by the Job model.
 */
function normalizeEmploymentType(value) {
  if (typeof value !== 'string') {
    return 'full-time';
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

  const mapping = {
    'full-time': 'full-time',
    fulltime: 'full-time',
    'full-time-employee': 'full-time',

    'part-time': 'part-time',
    parttime: 'part-time',

    contract: 'contract',
    contractor: 'contract',
    'contract-based': 'contract',

    temporary: 'temporary',
    temp: 'temporary',

    internship: 'internship',
    intern: 'internship',
  };

  return mapping[normalized] || 'full-time';
}

/**
 * Convert provider salary periods into our Job enum.
 */
function normalizeSalaryPeriod(value) {
  if (typeof value !== 'string') {
    return 'year';
  }

  const normalized = value
    .trim()
    .toLowerCase();

  const mapping = {
    hour: 'hour',
    hourly: 'hour',

    day: 'day',
    daily: 'day',

    week: 'week',
    weekly: 'week',

    month: 'month',
    monthly: 'month',

    year: 'year',
    yearly: 'year',
    annual: 'year',
    annually: 'year',
  };

  return mapping[normalized] || 'year';
}

/**
 * Convert external education strings into the structure
 * expected by the Job model.
 */
function normalizeEducationRequirements(
  educationRequirements = [],
) {
  if (!Array.isArray(educationRequirements)) {
    return [];
  }

  const results = [];

  for (const education of educationRequirements) {
    if (typeof education !== 'string') {
      continue;
    }

    const value = education
      .trim()
      .toLowerCase();

    let minimumLevel = null;

    if (
      value.includes('ph.d') ||
      value.includes('phd') ||
      value.includes('doctorate')
    ) {
      minimumLevel = 'doctorate';
    } else if (
      value.includes('master')
    ) {
      minimumLevel = 'master';
    } else if (
      value.includes('bachelor') ||
      value.includes('b.s') ||
      value.includes('b.sc') ||
      value.includes('b.tech') ||
      value.includes('b.e')
    ) {
      minimumLevel = 'bachelor';
    } else if (
      value.includes('associate')
    ) {
      minimumLevel = 'associate';
    } else if (
      value.includes('high school') ||
      value.includes('high-school')
    ) {
      minimumLevel = 'high-school';
    }

    if (!minimumLevel) {
      continue;
    }

    results.push({
      minimumLevel,
      fieldsOfStudy: [],
      isRequired: true,
    });
  }

  return results;
}

/**
 * Make sure location.remoteType is one of the values
 * allowed by the Job model.
 */
function normalizeRemoteType(value) {
  if (value === 'remote') {
    return 'remote';
  }

  if (value === 'hybrid') {
    return 'hybrid';
  }

  return 'onsite';
}

/**
 * Build the final MongoDB-compatible Job document.
 */
async function prepareExternalJob(externalJob) {
  const requiredSkills =
    await resolveSkillIds(
      externalJob.requiredSkills,
    );

  const preferredSkills =
    await resolveSkillIds(
      externalJob.preferredSkills,
    );

  const educationRequirements =
    normalizeEducationRequirements(
      externalJob.educationRequirements,
    );

  const salary = externalJob.salary || {};

  const location =
    externalJob.location || {};

  return {
    title: externalJob.title,
    description: externalJob.description,

    companyName:
      externalJob.companyName || null,

    location: {
      city: location.city || null,
      region: location.region || null,
      country: location.country || null,
      countryCode:
        location.countryCode || null,
      remoteType:
        normalizeRemoteType(
          location.remoteType,
        ),
    },

    employmentType:
      normalizeEmploymentType(
        externalJob.employmentType,
      ),

    salary: {
      minimum:
        salary.minimum ?? undefined,

      maximum:
        salary.maximum ?? undefined,

      currency:
        salary.currency || null,

      period:
        normalizeSalaryPeriod(
          salary.period,
        ),

      isDisclosed:
        salary.isDisclosed ?? false,
    },

    requiredSkills,

    preferredSkills,

    minimumExperience:
      typeof externalJob.minimumExperience ===
      'number'
        ? externalJob.minimumExperience
        : 0,

    maximumExperience:
      typeof externalJob.maximumExperience ===
      'number'
        ? externalJob.maximumExperience
        : undefined,

    educationRequirements,

    responsibilities:
      Array.isArray(
        externalJob.responsibilities,
      )
        ? externalJob.responsibilities
        : [],

    /*
     * External jobs are immediately published because
     * they already come from a public job provider.
     */
    status: 'published',

    publishedAt:
      externalJob.publishedAt ||
      new Date(),

    expiresAt:
      externalJob.externalExpiresAt ||
      null,

    applicationDeadline:
      externalJob.externalExpiresAt ||
      null,

    source: 'external',

    provider:
      externalJob.provider,

    sourceJobId:
      externalJob.sourceJobId,

    sourceUrl:
      externalJob.sourceUrl || null,

    externalApplyUrl:
      externalJob.externalApplyUrl ||
      externalJob.sourceUrl ||
      null,

    isExternal: true,

    lastSyncedAt:
      externalJob.lastSyncedAt ||
      new Date(),

    externalExpiresAt:
      externalJob.externalExpiresAt ||
      null,
  };
}

/* =========================================================
   EXTERNAL JOB SYNC SERVICE
========================================================= */

/**
 * Sync jobs from Himalayas into MongoDB.
 *
 * Flow:
 *
 * Himalayas API
 *      ↓
 * Provider normalization
 *      ↓
 * Skill names → Skill ObjectIds
 *      ↓
 * Education normalization
 *      ↓
 * Employment type normalization
 *      ↓
 * Salary normalization
 *      ↓
 * Published external Job
 *      ↓
 * MongoDB
 */
export async function syncHimalayasJobs({
  limit = 20,
  cursor = null,
} = {}) {
  const syncStartedAt = new Date();

  const result = {
    provider: 'himalayas',

    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,

    nextCursor: null,
    totalCount: 0,

    errors: [],

    startedAt: syncStartedAt,
    completedAt: null,
  };

  try {
    /* =====================================================
       1. FETCH JOBS FROM HIMALAYAS
    ===================================================== */

    const providerResult =
      await himalayasProvider.fetchJobs({
        limit,
        cursor,
      });

    const jobs = Array.isArray(
      providerResult.jobs,
    )
      ? providerResult.jobs
      : [];

    result.fetched = jobs.length;

    result.nextCursor =
      providerResult.nextCursor ?? null;

    result.totalCount =
      providerResult.totalCount ??
      jobs.length;

    /* =====================================================
       2. PROCESS EACH JOB
    ===================================================== */

    for (const externalJob of jobs) {
      try {
        /* -------------------------------------------------
           Basic validation
        ------------------------------------------------- */

        if (
          !externalJob ||
          !externalJob.provider ||
          !externalJob.sourceJobId
        ) {
          result.skipped += 1;

          result.errors.push({
            sourceJobId:
              externalJob?.sourceJobId ??
              null,

            message:
              'Missing provider or sourceJobId.',
          });

          continue;
        }

        /* -------------------------------------------------
           Prepare MongoDB-compatible job
        ------------------------------------------------- */

        const preparedJob =
          await prepareExternalJob(
            externalJob,
          );

        /* -------------------------------------------------
           Find existing external job
        ------------------------------------------------- */

        const existingJob =
          await Job.findOne({
            provider:
              preparedJob.provider,

            sourceJobId:
              preparedJob.sourceJobId,

            isExternal: true,
          });

        /* =================================================
           INSERT NEW JOB
        ================================================= */

        if (!existingJob) {
          await Job.create(
            preparedJob,
          );

          result.inserted += 1;

          continue;
        }

        /* =================================================
           UPDATE EXISTING JOB
        ================================================= */

        existingJob.title =
          preparedJob.title;

        existingJob.description =
          preparedJob.description;

        existingJob.companyName =
          preparedJob.companyName;

        existingJob.location =
          preparedJob.location;

        existingJob.employmentType =
          preparedJob.employmentType;

        existingJob.salary =
          preparedJob.salary;

        existingJob.requiredSkills =
          preparedJob.requiredSkills;

        existingJob.preferredSkills =
          preparedJob.preferredSkills;

        existingJob.minimumExperience =
          preparedJob.minimumExperience;

        existingJob.maximumExperience =
          preparedJob.maximumExperience;

        existingJob.educationRequirements =
          preparedJob.educationRequirements;

        existingJob.responsibilities =
          preparedJob.responsibilities;

        existingJob.status =
          preparedJob.status;

        /*
         * Keep the original publishedAt if this job was
         * already imported previously.
         */
        if (!existingJob.publishedAt) {
          existingJob.publishedAt =
            preparedJob.publishedAt;
        }

        existingJob.expiresAt =
          preparedJob.expiresAt;

        existingJob.applicationDeadline =
          preparedJob.applicationDeadline;

        existingJob.source =
          preparedJob.source;

        existingJob.provider =
          preparedJob.provider;

        existingJob.sourceJobId =
          preparedJob.sourceJobId;

        existingJob.sourceUrl =
          preparedJob.sourceUrl;

        existingJob.externalApplyUrl =
          preparedJob.externalApplyUrl;

        existingJob.isExternal = true;

        existingJob.lastSyncedAt =
          preparedJob.lastSyncedAt;

        existingJob.externalExpiresAt =
          preparedJob.externalExpiresAt;

        await existingJob.save();

        result.updated += 1;
      } catch (error) {
        result.failed += 1;

        result.errors.push({
          sourceJobId:
            externalJob?.sourceJobId ??
            null,

          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    result.completedAt = new Date();

    return result;
  } catch (error) {
    result.completedAt = new Date();

    throw new Error(
      `Himalayas job synchronization failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }
}