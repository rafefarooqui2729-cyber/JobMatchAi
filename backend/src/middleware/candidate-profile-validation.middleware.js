import { EDUCATION_LEVELS, EMPLOYMENT_TYPES, PROFICIENCY_LEVELS } from '../models/enums.js';
import mongoose from 'mongoose';

const ROOT_FIELDS = new Set([
  'firstName',
  'lastName',
  'phone',
  'location',
  'headline',
  'summary',
  'skills',
  'education',
  'experience',
  'projects',
  'certifications',
  'preferredRoles',
  'preferredLocations',
  'preferredEmploymentTypes',
  'profileVisibility',
]);

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function object(value, field, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${field} must be an object.`);
  }
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown) throw invalid(`Unexpected field in ${field}: ${unknown}.`);
  return value;
}

function preserveId(entry, field, result) {
  if (entry._id === undefined) return result;
  if (!mongoose.isValidObjectId(entry._id)) throw invalid(`${field}._id is invalid.`);
  result._id = entry._id;
  return result;
}

function string(value, field, { required = false, max = 200, min = 0 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw invalid(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== 'string') throw invalid(`${field} must be a string.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw invalid(`${field} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function date(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw invalid(`${field} must be a valid date in YYYY-MM-DD format.`);
  }
  return value;
}

function year(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(parsed) || parsed < 1950 || parsed > currentYear + 10) {
    throw invalid(`${field} must be a valid year.`);
  }
  return parsed;
}

function url(value, field) {
  const normalized = string(value, field, { max: 2048 });
  if (!normalized) return undefined;
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw invalid(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw invalid(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  return normalized;
}

function stringArray(value, field, { maxItems = 30, maxLength = 120 } = {}) {
  if (!Array.isArray(value)) throw invalid(`${field} must be an array.`);
  if (value.length > maxItems) throw invalid(`${field} cannot contain more than ${maxItems} items.`);
  return value.map((item, index) => string(item, `${field}[${index}]`, { required: true, min: 1, max: maxLength }));
}

function validateLocation(value, field, preferred = false) {
  const allowed = preferred
    ? ['city', 'region', 'country', 'countryCode', 'remoteType']
    : ['city', 'region', 'country', 'countryCode'];
  const location = object(value, field, allowed);
  const result = {};
  for (const key of ['city', 'region', 'country']) {
    if (Object.hasOwn(location, key)) result[key] = string(location[key], `${field}.${key}`, { max: 120 });
  }
  if (Object.hasOwn(location, 'countryCode')) {
    result.countryCode = string(location.countryCode, `${field}.countryCode`, { max: 2 })?.toUpperCase();
    if (result.countryCode && !/^[A-Z]{2}$/.test(result.countryCode)) throw invalid(`${field}.countryCode must be a two-letter country code.`);
  }
  if (preferred && Object.hasOwn(location, 'remoteType')) {
    const remoteType = string(location.remoteType, `${field}.remoteType`, { max: 20 });
    if (!['onsite', 'hybrid', 'remote'].includes(remoteType)) throw invalid(`${field}.remoteType is invalid.`);
    result.remoteType = remoteType;
  }
  return result;
}

function validateSkills(value, field = 'skills') {
  if (!Array.isArray(value)) throw invalid(`${field} must be an array.`);
  if (value.length > 100) throw invalid(`${field} cannot contain more than 100 items.`);
  return value.map((item, index) => {
    const itemField = `${field}[${index}]`;
    if (typeof item === 'string') return string(item, itemField, { required: true, min: 1, max: 100 });
    const skill = object(item, itemField, ['name', 'proficiency', 'yearsExperience']);
    const result = { name: string(skill.name, `${itemField}.name`, { required: true, min: 1, max: 100 }) };
    if (skill.proficiency !== undefined) {
      if (!PROFICIENCY_LEVELS.includes(skill.proficiency)) throw invalid(`${itemField}.proficiency is invalid.`);
      result.proficiency = skill.proficiency;
    }
    if (skill.yearsExperience !== undefined) {
      const years = Number(skill.yearsExperience);
      if (!Number.isFinite(years) || years < 0 || years > 80) throw invalid(`${itemField}.yearsExperience must be between 0 and 80.`);
      result.yearsExperience = years;
    }
    return result;
  });
}

function validateEducation(value) {
  if (!Array.isArray(value) || value.length > 30) throw invalid('education must be an array with no more than 30 items.');
  return value.map((item, index) => {
    const field = `education[${index}]`;
    const entry = object(item, field, ['_id', 'degree', 'institution', 'fieldOfStudy', 'level', 'startYear', 'endYear', 'isCurrent', 'description']);
    const result = {
      institution: string(entry.institution, `${field}.institution`, { required: true, min: 1, max: 200 }),
      degree: string(entry.degree, `${field}.degree`, { max: 160 }),
      fieldOfStudy: string(entry.fieldOfStudy, `${field}.fieldOfStudy`, { max: 160 }),
      level: entry.level,
      startYear: year(entry.startYear, `${field}.startYear`),
      endYear: entry.isCurrent === true ? undefined : year(entry.endYear, `${field}.endYear`),
      isCurrent: entry.isCurrent === true,
      description: string(entry.description, `${field}.description`, { max: 2000 }),
    };
    if (!EDUCATION_LEVELS.includes(result.level)) throw invalid(`${field}.level is invalid.`);
    if (result.startYear && result.endYear && result.endYear < result.startYear) throw invalid(`${field}.endYear cannot precede startYear.`);
    return preserveId(entry, field, result);
  });
}

function validateExperience(value) {
  if (!Array.isArray(value) || value.length > 40) throw invalid('experience must be an array with no more than 40 items.');
  return value.map((item, index) => {
    const field = `experience[${index}]`;
    const entry = object(item, field, ['_id', 'employer', 'title', 'location', 'startDate', 'endDate', 'isCurrent', 'description', 'technologies']);
    const result = {
      employer: string(entry.employer, `${field}.employer`, { required: true, min: 1, max: 200 }),
      title: string(entry.title, `${field}.title`, { required: true, min: 1, max: 160 }),
      location: string(entry.location, `${field}.location`, { max: 200 }),
      startDate: date(entry.startDate, `${field}.startDate`),
      endDate: entry.isCurrent === true ? undefined : date(entry.endDate, `${field}.endDate`),
      isCurrent: entry.isCurrent === true,
      description: string(entry.description, `${field}.description`, { max: 4000 }),
      technologies: entry.technologies === undefined ? [] : stringArray(entry.technologies, `${field}.technologies`, { maxItems: 40, maxLength: 100 }),
    };
    if (!result.startDate) throw invalid(`${field}.startDate is required.`);
    if (!result.isCurrent && result.endDate && result.endDate < result.startDate) throw invalid(`${field}.endDate cannot precede startDate.`);
    return preserveId(entry, field, result);
  });
}

function validateProjects(value) {
  if (!Array.isArray(value) || value.length > 40) throw invalid('projects must be an array with no more than 40 items.');
  return value.map((item, index) => {
    const field = `projects[${index}]`;
    const entry = object(item, field, ['_id', 'name', 'description', 'technologies', 'url', 'githubUrl']);
    const result = {
      name: string(entry.name, `${field}.name`, { required: true, min: 1, max: 200 }),
      description: string(entry.description, `${field}.description`, { max: 4000 }),
      technologies: entry.technologies === undefined ? [] : stringArray(entry.technologies, `${field}.technologies`, { maxItems: 40, maxLength: 100 }),
      url: url(entry.url, `${field}.url`),
      githubUrl: url(entry.githubUrl, `${field}.githubUrl`),
    };
    return preserveId(entry, field, result);
  });
}

function validateCertifications(value) {
  if (!Array.isArray(value) || value.length > 40) throw invalid('certifications must be an array with no more than 40 items.');
  return value.map((item, index) => {
    const field = `certifications[${index}]`;
    const entry = object(item, field, ['_id', 'name', 'issuer', 'issuedAt', 'credentialUrl']);
    const result = {
      name: string(entry.name, `${field}.name`, { required: true, min: 1, max: 200 }),
      issuer: string(entry.issuer, `${field}.issuer`, { max: 200 }),
      issuedAt: date(entry.issuedAt, `${field}.issuedAt`),
      credentialUrl: url(entry.credentialUrl, `${field}.credentialUrl`),
    };
    return preserveId(entry, field, result);
  });
}

export function validateCandidateProfileUpdate(req, res, next) {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('A JSON object request body is required.');
    const unknown = Object.keys(body).find((key) => !ROOT_FIELDS.has(key));
    if (unknown) throw invalid(`Unexpected profile field: ${unknown}.`);
    if (!Object.keys(body).length) throw invalid('Provide at least one profile field to update.');

    const result = {};
    for (const key of ['firstName', 'lastName']) {
      if (Object.hasOwn(body, key)) result[key] = string(body[key], key, { required: true, min: 1, max: 80 });
    }
    if (Object.hasOwn(body, 'phone')) result.phone = string(body.phone, 'phone', { max: 32 });
    if (Object.hasOwn(body, 'headline')) result.headline = string(body.headline, 'headline', { max: 180 });
    if (Object.hasOwn(body, 'summary')) result.summary = string(body.summary, 'summary', { max: 4000 });
    if (Object.hasOwn(body, 'location')) result.location = validateLocation(body.location, 'location');
    if (Object.hasOwn(body, 'skills')) result.skills = validateSkills(body.skills);
    if (Object.hasOwn(body, 'education')) result.education = validateEducation(body.education);
    if (Object.hasOwn(body, 'experience')) result.experience = validateExperience(body.experience);
    if (Object.hasOwn(body, 'projects')) result.projects = validateProjects(body.projects);
    if (Object.hasOwn(body, 'certifications')) result.certifications = validateCertifications(body.certifications);
    if (Object.hasOwn(body, 'preferredRoles')) result.preferredRoles = stringArray(body.preferredRoles, 'preferredRoles', { maxItems: 20, maxLength: 160 });
    if (Object.hasOwn(body, 'preferredLocations')) {
      if (!Array.isArray(body.preferredLocations) || body.preferredLocations.length > 20) throw invalid('preferredLocations must be an array with no more than 20 items.');
      result.preferredLocations = body.preferredLocations.map((location, index) => {
        const parsed = validateLocation(location, `preferredLocations[${index}]`, true);
        if (!parsed.city && !parsed.country && !parsed.remoteType) {
          throw invalid(`preferredLocations[${index}] must include a city, country, or work style.`);
        }
        return parsed;
      });
    }
    if (Object.hasOwn(body, 'preferredEmploymentTypes')) {
      result.preferredEmploymentTypes = stringArray(body.preferredEmploymentTypes, 'preferredEmploymentTypes', { maxItems: EMPLOYMENT_TYPES.length, maxLength: 30 });
      if (result.preferredEmploymentTypes.some((type) => !EMPLOYMENT_TYPES.includes(type))) throw invalid('preferredEmploymentTypes contains an invalid employment type.');
      result.preferredEmploymentTypes = [...new Set(result.preferredEmploymentTypes)];
    }
    if (Object.hasOwn(body, 'profileVisibility')) {
      if (!['private', 'employers'].includes(body.profileVisibility)) {
        throw invalid('profileVisibility must be private or employers.');
      }
      result.profileVisibility = body.profileVisibility;
    }
    req.validatedProfile = result;
    next();
  } catch (error) {
    next(error);
  }
}
