const cleanString = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0 ? cleaned : null;
};

const cleanArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

export function normalizeExternalJob(rawJob, provider) {
  if (!rawJob || typeof rawJob !== 'object') {
    throw new Error('Invalid external job data.');
  }

  const sourceJobId = cleanString(rawJob.sourceJobId);

  const title = cleanString(rawJob.title);
  const description = cleanString(rawJob.description);

  if (!sourceJobId) {
    throw new Error('External job is missing sourceJobId.');
  }

  if (!title) {
    throw new Error('External job is missing title.');
  }

  if (!description) {
    throw new Error('External job is missing description.');
  }

  return {
    title,
    description,

    companyName: cleanString(rawJob.companyName),

    location: {
      city: cleanString(rawJob.location?.city),
      region: cleanString(rawJob.location?.region),
      country: cleanString(rawJob.location?.country),
      countryCode: cleanString(rawJob.location?.countryCode),
      remoteType: cleanString(rawJob.location?.remoteType) || 'onsite',
    },

    employmentType: cleanString(rawJob.employmentType),

    salary: {
      minimum: rawJob.salary?.minimum ?? undefined,
      maximum: rawJob.salary?.maximum ?? undefined,
      currency: cleanString(rawJob.salary?.currency),
      period: cleanString(rawJob.salary?.period) || 'year',
      isDisclosed: rawJob.salary?.isDisclosed ?? true,
    },

    requiredSkills: cleanArray(rawJob.requiredSkills),
    preferredSkills: cleanArray(rawJob.preferredSkills),

    minimumExperience:
      typeof rawJob.minimumExperience === 'number'
        ? rawJob.minimumExperience
        : 0,

    maximumExperience:
      typeof rawJob.maximumExperience === 'number'
        ? rawJob.maximumExperience
        : undefined,

    educationRequirements: Array.isArray(
      rawJob.educationRequirements,
    )
      ? rawJob.educationRequirements
      : [],

    responsibilities: cleanArray(rawJob.responsibilities),

    source: 'external',
    provider,
    sourceJobId,

    sourceUrl: cleanString(rawJob.sourceUrl),
    externalApplyUrl: cleanString(rawJob.externalApplyUrl),

    isExternal: true,

    lastSyncedAt: new Date(),

    externalExpiresAt: rawJob.externalExpiresAt
      ? new Date(rawJob.externalExpiresAt)
      : null,
  };
}