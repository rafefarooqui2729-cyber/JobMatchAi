import {
  MATCHING_WEIGHTS,
  MATCHING_WEIGHT_TOTAL,
  MATCH_STRENGTHS,
  SKILL_ALIASES,
} from './matching.config.js';

const aliasLookup = new Map();

function compact(value) {
  return value.replace(/[^\p{L}\p{N}+#]/gu, '');
}

for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  const canonicalKey = compact(canonical.normalize('NFKC').toLocaleLowerCase('en'));
  aliasLookup.set(canonicalKey, canonical);
  for (const alias of aliases) {
    const key = compact(alias.normalize('NFKC').toLocaleLowerCase('en'));
    aliasLookup.set(key, canonical);
  }
}

export function normalizeSkillName(value) {
  if (typeof value !== 'string') return '';
  const normalized = value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .trim()
    .replace(/[^\p{L}\p{N}+#. ]/gu, ' ')
    .replace(/\s+/g, ' ');
  if (!normalized) return '';
  return aliasLookup.get(compact(normalized)) ?? normalized.replace(/[.]/g, '').replace(/\s+/g, ' ');
}

function skillName(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  if (typeof value.name === 'string') return value.name.trim();
  if (typeof value.normalizedName === 'string') return value.normalizedName.trim();
  if (typeof value.skill === 'string') return value.skill.trim();
  if (value.skill && typeof value.skill === 'object') {
    return skillName(value.skill);
  }
  return '';
}

function uniqueSkills(values) {
  if (!Array.isArray(values)) return [];
  const skills = new Map();
  for (const value of values) {
    const displayName = skillName(value);
    const key = normalizeSkillName(displayName);
    if (key && !skills.has(key)) skills.set(key, displayName);
  }
  return [...skills].map(([key, name]) => ({ key, name }));
}

function boundedScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

function percentage(numerator, denominator, emptyScore = 100) {
  if (denominator === 0) return emptyScore;
  return boundedScore((numerator / denominator) * 100);
}

function skillMatch(candidate, job) {
  const candidateSkills = uniqueSkills(candidate.skills);
  const required = uniqueSkills(job.requiredSkills);
  const preferred = uniqueSkills(job.preferredSkills);
  const candidateKeys = new Set(candidateSkills.map(({ key }) => key));

  const matchedRequired = required.filter(({ key }) => candidateKeys.has(key));
  const matchedPreferred = preferred.filter(({ key }) => candidateKeys.has(key));
  const missingRequired = required.filter(({ key }) => !candidateKeys.has(key));
  const missingPreferred = preferred.filter(({ key }) => !candidateKeys.has(key));

  let score = 100;
  if (required.length && preferred.length) {
    score = (percentage(matchedRequired.length, required.length) * 0.8)
      + (percentage(matchedPreferred.length, preferred.length) * 0.2);
  } else if (required.length) {
    score = percentage(matchedRequired.length, required.length);
  } else if (preferred.length) {
    score = percentage(matchedPreferred.length, preferred.length);
  }

  const matchedSkills = [...new Map(
    [...matchedRequired, ...matchedPreferred].map((entry) => [entry.key, entry.name]),
  ).values()];
  return {
    score: boundedScore(score),
    matchedSkills,
    missingRequiredSkills: missingRequired.map(({ name }) => name),
    missingPreferredSkills: missingPreferred.map(({ name }) => name),
  };
}

function toValidDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function candidateExperienceYears(candidate) {
  for (const value of [candidate.totalExperienceYears, candidate.experienceYears]) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  }

  const intervals = (Array.isArray(candidate.experience) ? candidate.experience : [])
    .map((entry) => {
      const start = toValidDate(entry?.startDate);
      const end = entry?.isCurrent ? new Date() : toValidDate(entry?.endDate);
      if (!start || end < start) return null;
      return [start.getTime(), end.getTime()];
    })
    .filter(Boolean)
    .sort(([startA], [startB]) => startA - startB);

  if (!intervals.length) return null;
  let [start, end] = intervals[0];
  let duration = 0;
  for (const [nextStart, nextEnd] of intervals.slice(1)) {
    if (nextStart <= end) {
      end = Math.max(end, nextEnd);
    } else {
      duration += end - start;
      start = nextStart;
      end = nextEnd;
    }
  }
  duration += end - start;
  return duration / (365.25 * 24 * 60 * 60 * 1000);
}

function experienceMatch(candidate, job) {
  const minimum = Number.isFinite(job.minimumExperience) ? Math.max(0, job.minimumExperience) : 0;
  const maximum = Number.isFinite(job.maximumExperience) ? Math.max(0, job.maximumExperience) : null;
  const constrained = minimum > 0 || maximum !== null;
  if (!constrained) return { score: 100, years: candidateExperienceYears(candidate), constrained: false };

  const years = candidateExperienceYears(candidate);
  if (years === null) return { score: 0, years: null, constrained: true };
  if (years < minimum) {
    return { score: minimum === 0 ? 100 : boundedScore((years / minimum) * 100), years, constrained: true };
  }
  if (maximum === null || years <= maximum) return { score: 100, years, constrained: true };
  const overBy = years - maximum;
  const tolerance = Math.max(2, maximum * 0.5);
  const overqualifiedPenalty = Math.min(50, (overBy / tolerance) * 25);
  return { score: boundedScore(100 - overqualifiedPenalty), years, constrained: true };
}

const educationOrder = Object.freeze({
  'high-school': 1,
  diploma: 2,
  associate: 3,
  bachelor: 4,
  master: 5,
  doctorate: 6,
  other: 0,
});

function textTokens(value) {
  return (typeof value === 'string' ? value : '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en')
    .match(/[\p{L}\p{N}+#]+/gu) ?? [];
}

function fieldOfStudyScore(candidateField, requiredFields) {
  if (!requiredFields.length) return 100;
  const candidateTokens = new Set(textTokens(candidateField));
  if (!candidateTokens.size) return 0;
  return Math.max(...requiredFields.map((field) => {
    const requiredTokens = textTokens(field);
    if (!requiredTokens.length) return 0;
    const overlap = requiredTokens.filter((token) => candidateTokens.has(token)).length;
    return percentage(overlap, requiredTokens.length, 0);
  }));
}

function educationMatch(candidate, job) {
  const requirements = Array.isArray(job.educationRequirements)
    ? job.educationRequirements.filter((item) => item && item.isRequired !== false && (
      item.minimumLevel ||
      (Array.isArray(item.fieldsOfStudy) && item.fieldsOfStudy.length > 0)
    ))
    : [];
  if (!requirements.length) return { score: 100, constrained: false };

  const education = Array.isArray(candidate.education) ? candidate.education : [];
  const requirementScores = requirements.map((requirement) => {
    if (!education.length) return 0;
    const targetLevel = educationOrder[requirement.minimumLevel] ?? 0;
    const fields = Array.isArray(requirement.fieldsOfStudy) ? requirement.fieldsOfStudy : [];
    return Math.max(...education.map((entry) => {
      const candidateLevel = educationOrder[entry?.level] ?? 0;
      const levelScore = targetLevel === 0
        ? 100
        : candidateLevel >= targetLevel
          ? 100
          : percentage(candidateLevel, targetLevel, 0);
      const fieldScore = fieldOfStudyScore(entry?.fieldOfStudy, fields);
      return (levelScore * 0.7) + (fieldScore * 0.3);
    }));
  });
  return {
    score: boundedScore(requirementScores.reduce((sum, score) => sum + score, 0) / requirementScores.length),
    constrained: true,
  };
}

const stopWords = new Set([
  'and', 'the', 'for', 'with', 'from', 'into', 'your', 'this', 'that', 'our',
  'you', 'are', 'will', 'have', 'has', 'job', 'role', 'team', 'work', 'years',
  'experience', 'required', 'preferred', 'skills', 'responsibilities', 'ability',
]);

function jobSkillKeys(job) {
  return new Set([
    ...uniqueSkills(job.requiredSkills),
    ...uniqueSkills(job.preferredSkills),
  ].map(({ key }) => key));
}

function projectMatch(candidate, job) {
  const projects = Array.isArray(candidate.projects) ? candidate.projects : [];
  const relevantSkills = jobSkillKeys(job);
  const jobText = [
    job.title,
    job.description,
    ...(Array.isArray(job.responsibilities) ? job.responsibilities : []),
  ].flatMap(textTokens).filter((token) => !stopWords.has(token));
  const jobTokenSet = new Set(jobText);

  if (!relevantSkills.size && !jobTokenSet.size) return 100;
  if (!projects.length) return 0;

  const scores = projects.map((project) => {
    const projectSkills = uniqueSkills([
      ...(Array.isArray(project?.skills) ? project.skills : []),
      ...(Array.isArray(project?.technologies) ? project.technologies : []),
    ]);
    const technologyScore = relevantSkills.size
      ? percentage(projectSkills.filter(({ key }) => relevantSkills.has(key)).length, relevantSkills.size, 0)
      : 0;

    const projectText = [project?.name, project?.description].flatMap(textTokens)
      .filter((token) => !stopWords.has(token));
    const projectTokens = new Set(projectText);
    const textScore = jobTokenSet.size
      ? percentage([...projectTokens].filter((token) => jobTokenSet.has(token)).length, Math.min(jobTokenSet.size, 8), 0)
      : 0;

    if (relevantSkills.size && jobTokenSet.size) {
      return Math.max(technologyScore, (technologyScore * 0.7) + (textScore * 0.3));
    }
    return relevantSkills.size ? technologyScore : textScore;
  });
  return boundedScore(Math.max(...scores));
}

function normalizePlace(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, ' ')
    : '';
}

function locationMatch(candidate, job) {
  const target = job.location ?? {};
  const targetHasPlace = Boolean(target.city || target.region || target.country || target.countryCode);
  const remoteType = target.remoteType;
  if (!targetHasPlace && !remoteType) return 100;
  if (remoteType === 'remote') return 100;

  let locations = Array.isArray(candidate.preferredLocations)
    ? candidate.preferredLocations.filter(Boolean)
    : [];
  if (!locations.length && candidate.location && Object.values(candidate.location).some(Boolean)) {
    locations = [candidate.location];
  }
  if (!locations.length) return 0;

  return boundedScore(Math.max(...locations.map((preferred) => {
    const preferredRemoteType = preferred.remoteType;
    if (preferredRemoteType === 'remote' && remoteType === 'onsite') return 0;

    const targetCountryCode = normalizePlace(target.countryCode);
    const preferredCountryCode = normalizePlace(preferred.countryCode);
    const sameCountryCode = targetCountryCode && preferredCountryCode
      ? targetCountryCode === preferredCountryCode
      : false;
    const sameCountry = normalizePlace(target.country) !== ''
      && normalizePlace(target.country) === normalizePlace(preferred.country);
    const sameCity = normalizePlace(target.city) !== ''
      && normalizePlace(target.city) === normalizePlace(preferred.city);
    const sameRegion = normalizePlace(target.region) !== ''
      && normalizePlace(target.region) === normalizePlace(preferred.region);

    let geographicScore = sameCity ? 100
      : sameCountryCode || sameCountry ? 85
        : sameRegion ? 70
          : 0;
    if (remoteType === 'hybrid' && geographicScore > 0) geographicScore = Math.min(100, geographicScore + 5);
    if (remoteType === 'hybrid' && geographicScore === 0 && preferredRemoteType === 'hybrid') geographicScore = 70;
    if (remoteType === 'onsite' && preferredRemoteType === 'remote') geographicScore = 0;
    if (remoteType === 'remote') geographicScore = 100;
    return geographicScore;
  })));
}

export function classifyMatchStrength(score) {
  if (!Number.isFinite(score)) return 'Low';
  return MATCH_STRENGTHS.find(({ minimum }) => score >= minimum)?.label ?? 'Low';
}

function explanationFor(overallScore, categoryScores, skillResult, experienceResult, educationResult, candidate, job, strength) {
  const hasSkillCriteria = uniqueSkills(job.requiredSkills).length > 0 || uniqueSkills(job.preferredSkills).length > 0;
  const parts = [
    `${strength} match at ${overallScore}%.`,
    hasSkillCriteria
      ? `Skills scored ${categoryScores.skills}%${skillResult.missingRequiredSkills.length
      ? `; missing required skills: ${skillResult.missingRequiredSkills.join(', ')}`
      : '; all required skills matched'}.`
      : 'No skills criteria were provided.',
    experienceResult.constrained
      ? experienceResult.years === null
        ? 'Experience could not be verified from the candidate profile.'
        : `Experience scored ${categoryScores.experience}% based on approximately ${experienceResult.years.toFixed(1)} years.`
      : 'No minimum or maximum experience requirement was provided.',
    educationResult.constrained
      ? `Education scored ${categoryScores.education}% against the listed education requirements.`
      : 'No required education requirement was provided.',
    (Array.isArray(candidate.projects) && candidate.projects.length)
      ? `Project relevance scored ${categoryScores.projects}%.`
      : 'No projects were listed, so project relevance could not be demonstrated.',
    categoryScores.location === 100 && job.location?.remoteType === 'remote'
      ? 'The job is remote.'
      : `Location scored ${categoryScores.location}% based on the candidate’s location preferences or current location.`,
  ];
  if (skillResult.matchedSkills.length) {
    parts.push(`Matched skills: ${skillResult.matchedSkills.join(', ')}.`);
  }
  if (skillResult.missingPreferredSkills.length) {
    parts.push(`Missing preferred skills: ${skillResult.missingPreferredSkills.join(', ')}.`);
  }
  return parts.join(' ');
}

export function calculateMatch(candidateProfile = {}, job = {}) {
  const candidate = candidateProfile && typeof candidateProfile === 'object' ? candidateProfile : {};
  const opening = job && typeof job === 'object' ? job : {};

  const skills = skillMatch(candidate, opening);
  const experience = experienceMatch(candidate, opening);
  const education = educationMatch(candidate, opening);
  const categoryScores = {
    skills: skills.score,
    experience: experience.score,
    education: education.score,
    projects: projectMatch(candidate, opening),
    location: locationMatch(candidate, opening),
  };
  const meaningfulCriteria = {
    skills: uniqueSkills([...(opening.requiredSkills ?? []), ...(opening.preferredSkills ?? [])]).length > 0,
    experience: Number.isFinite(opening.minimumExperience) && opening.minimumExperience > 0
      || Number.isFinite(opening.maximumExperience),
    education: education.constrained,
    projects: Boolean(
      jobSkillKeys(opening).size
      || [opening.title, opening.description, ...(Array.isArray(opening.responsibilities) ? opening.responsibilities : [])]
        .some((value) => textTokens(value).some((token) => !stopWords.has(token))),
    ),
    location: Boolean(
      opening.location?.city || opening.location?.region || opening.location?.country
      || opening.location?.countryCode || opening.location?.remoteType,
    ),
  };
  const coveredWeight = Object.entries(meaningfulCriteria).reduce(
    (sum, [category, meaningful]) => sum + (meaningful ? MATCHING_WEIGHTS[category] : 0),
    0,
  );
  const weightedScore = Object.entries(categoryScores).reduce(
    (sum, [category, score]) => sum + (meaningfulCriteria[category] ? score * MATCHING_WEIGHTS[category] : 0),
    0,
  );
  const criteriaCoverage = Math.round((coveredWeight / MATCHING_WEIGHT_TOTAL) * 100);
  const overallScore = boundedScore(weightedScore / MATCHING_WEIGHT_TOTAL);
  const matchConfidence = criteriaCoverage >= 75 ? 'high' : criteriaCoverage >= 50 ? 'moderate' : 'low';
  const strength = classifyMatchStrength(overallScore);

  const explanation = explanationFor(overallScore, categoryScores, skills, experience, education, candidate, opening, strength);
  return {
    overallScore,
    criteriaCoverage,
    matchConfidence,
    meaningfulCriteria,
    categoryScores,
    matchedSkills: skills.matchedSkills,
    missingRequiredSkills: skills.missingRequiredSkills,
    missingPreferredSkills: skills.missingPreferredSkills,
    explanation: `${explanation} Criteria coverage is ${criteriaCoverage}% (${matchConfidence} confidence).`,
    matchStrength: strength,
  };
}

export const scoreJobMatch = calculateMatch;
