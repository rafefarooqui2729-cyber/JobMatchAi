import mongoose from 'mongoose';
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  REMOTE_TYPES,
  SALARY_PERIODS,
} from '../models/enums.js';

const COMPANY_FIELDS = new Set([
  'name',
  'description',
  'website',
  'industry',
  'size',
  'headquarters',
]);
const JOB_FIELDS = new Set([
  'title',
  'description',
  'responsibilities',
  'requiredSkills',
  'preferredSkills',
  'minimumExperience',
  'maximumExperience',
  'educationRequirements',
  'location',
  'employmentType',
  'salary',
  'applicationDeadline',
]);
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown'];

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function object(value, field, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${field} must be an object.`);
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown) throw invalid(`Unexpected field in ${field}: ${unknown}.`);
  return value;
}

function string(value, field, { required = false, min = 0, max = 200 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw invalid(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== 'string') throw invalid(`${field} must be a string.`);
  const result = value.trim();
  if (result.length < min || result.length > max) throw invalid(`${field} must be between ${min} and ${max} characters.`);
  return result;
}

function parseUrl(value, field) {
  const result = string(value, field, { max: 2048 });
  if (!result) return undefined;
  try {
    const parsed = new URL(result);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return result;
  } catch {
    // Report the same validation message for malformed and unsupported URLs.
  }
  throw invalid(`${field} must be a valid HTTP or HTTPS URL.`);
}

function number(value, field, { min = 0, max = 1000000000, required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw invalid(`${field} is required.`);
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw invalid(`${field} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function date(value, field) {
  if (value === undefined || value === null || value === '') return null;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw invalid(`${field} must be a valid date in YYYY-MM-DD format.`);
  }
  return new Date(`${value}T00:00:00Z`);
}

function stringArray(value, field, { maxItems = 60, maxLength = 100, required = false } = {}) {
  if (!Array.isArray(value)) throw invalid(`${field} must be an array.`);
  if (value.length > maxItems) throw invalid(`${field} cannot contain more than ${maxItems} items.`);
  const result = value.map((item, index) => string(item, `${field}[${index}]`, { required: true, min: 1, max: maxLength }));
  const seen = new Set();
  for (const item of result) {
    const key = item.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[_\-\s]+/g, ' ');
    if (seen.has(key)) throw invalid(`${field} cannot contain duplicate values.`);
    seen.add(key);
  }
  if (required && result.length === 0) throw invalid(`${field} must contain at least one item.`);
  return result;
}

function location(value) {
  const entry = object(value, 'location', ['city', 'region', 'country', 'countryCode', 'remoteType']);
  const result = {};
  for (const key of ['city', 'region', 'country']) {
    if (Object.hasOwn(entry, key)) result[key] = string(entry[key], `location.${key}`, { max: 120 });
  }
  if (Object.hasOwn(entry, 'countryCode')) {
    result.countryCode = string(entry.countryCode, 'location.countryCode', { max: 2 })?.toUpperCase();
    if (result.countryCode && !/^[A-Z]{2}$/.test(result.countryCode)) throw invalid('location.countryCode must be a two-letter code.');
  }
  if (Object.hasOwn(entry, 'remoteType')) {
    if (!REMOTE_TYPES.includes(entry.remoteType)) throw invalid('location.remoteType is invalid.');
    result.remoteType = entry.remoteType;
  }
  if (!result.city && !result.country && !result.remoteType) throw invalid('location must include a city, country, or remote work style.');
  return result;
}

function educationRequirements(value) {
  if (!Array.isArray(value) || value.length > 10) throw invalid('educationRequirements must be an array with no more than 10 items.');
  return value.map((item, index) => {
    const field = `educationRequirements[${index}]`;
    const entry = object(item, field, ['minimumLevel', 'fieldsOfStudy', 'isRequired']);
    if (!EDUCATION_LEVELS.includes(entry.minimumLevel)) throw invalid(`${field}.minimumLevel is invalid.`);
    return {
      minimumLevel: entry.minimumLevel,
      fieldsOfStudy: entry.fieldsOfStudy === undefined
        ? []
        : stringArray(entry.fieldsOfStudy, `${field}.fieldsOfStudy`, { maxItems: 20, maxLength: 160 }),
      isRequired: entry.isRequired === true,
    };
  });
}

function salary(value) {
  const entry = object(value, 'salary', ['minimum', 'maximum', 'currency', 'period', 'isDisclosed']);
  const result = {
    minimum: number(entry.minimum, 'salary.minimum'),
    maximum: number(entry.maximum, 'salary.maximum'),
    currency: string(entry.currency, 'salary.currency', { max: 3 })?.toUpperCase(),
    period: entry.period ?? 'year',
    isDisclosed: entry.isDisclosed !== false,
  };
  if (!SALARY_PERIODS.includes(result.period)) throw invalid('salary.period is invalid.');
  if (result.currency && !/^[A-Z]{3}$/.test(result.currency)) throw invalid('salary.currency must be a three-letter currency code.');
  if ((result.minimum != null || result.maximum != null) && !result.currency) throw invalid('salary.currency is required when a salary amount is provided.');
  if (result.minimum != null && result.maximum != null && result.maximum < result.minimum) throw invalid('salary.maximum must be at least salary.minimum.');
  return result;
}

export function validateCompanyUpdate(req, res, next) {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('A JSON object request body is required.');
    const unknown = Object.keys(body).find((key) => !COMPANY_FIELDS.has(key));
    if (unknown) throw invalid(`Unexpected company field: ${unknown}.`);
    if (!Object.keys(body).length) throw invalid('Provide at least one company field to update.');
    const result = {};
    if (Object.hasOwn(body, 'name')) result.name = string(body.name, 'name', { required: true, min: 1, max: 200 });
    if (Object.hasOwn(body, 'description')) result.description = string(body.description, 'description', { max: 5000 });
    if (Object.hasOwn(body, 'website')) result.website = parseUrl(body.website, 'website');
    if (Object.hasOwn(body, 'industry')) result.industry = string(body.industry, 'industry', { max: 120 });
    if (Object.hasOwn(body, 'size')) {
      if (!COMPANY_SIZES.includes(body.size)) throw invalid('size is invalid.');
      result.size = body.size;
    }
    if (Object.hasOwn(body, 'headquarters')) {
      const address = object(body.headquarters, 'headquarters', ['city', 'region', 'country', 'countryCode']);
      result.headquarters = {};
      for (const key of ['city', 'region', 'country']) {
        if (Object.hasOwn(address, key)) result.headquarters[key] = string(address[key], `headquarters.${key}`, { max: 120 });
      }
      if (Object.hasOwn(address, 'countryCode')) {
        result.headquarters.countryCode = string(address.countryCode, 'headquarters.countryCode', { max: 2 })?.toUpperCase();
        if (result.headquarters.countryCode && !/^[A-Z]{2}$/.test(result.headquarters.countryCode)) throw invalid('headquarters.countryCode must be a two-letter code.');
      }
    }
    req.validatedCompany = result;
    next();
  } catch (error) {
    next(error);
  }
}

export function validateJob(req, res, next) {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('A JSON object request body is required.');
    const unknown = Object.keys(body).find((key) => !JOB_FIELDS.has(key));
    if (unknown) throw invalid(`Unexpected job field: ${unknown}.`);
    if (!Object.keys(body).length) throw invalid('Provide at least one job field to update.');
    const result = {};
    if (Object.hasOwn(body, 'title')) result.title = string(body.title, 'title', { required: true, min: 1, max: 200 });
    if (Object.hasOwn(body, 'description')) result.description = string(body.description, 'description', { required: true, min: 1, max: 20000 });
    if (Object.hasOwn(body, 'responsibilities')) {
      result.responsibilities = stringArray(body.responsibilities, 'responsibilities', { maxItems: 50, maxLength: 1000 });
    }
    for (const field of ['requiredSkills', 'preferredSkills']) {
      if (Object.hasOwn(body, field)) result[field] = stringArray(body[field], field, { maxItems: 100, maxLength: 100 });
    }
    if (Object.hasOwn(body, 'minimumExperience')) result.minimumExperience = number(body.minimumExperience, 'minimumExperience', { max: 80 });
    if (Object.hasOwn(body, 'maximumExperience')) result.maximumExperience = number(body.maximumExperience, 'maximumExperience', { max: 80 });
    if (
      result.minimumExperience != null &&
      result.maximumExperience != null &&
      result.maximumExperience < result.minimumExperience
    ) throw invalid('maximumExperience must be greater than or equal to minimumExperience.');
    if (Object.hasOwn(body, 'educationRequirements')) result.educationRequirements = educationRequirements(body.educationRequirements);
    if (Object.hasOwn(body, 'location')) result.location = location(body.location);
    if (Object.hasOwn(body, 'employmentType')) {
      if (!EMPLOYMENT_TYPES.includes(body.employmentType)) throw invalid('employmentType is invalid.');
      result.employmentType = body.employmentType;
    }
    if (Object.hasOwn(body, 'salary')) result.salary = salary(body.salary);
    if (Object.hasOwn(body, 'applicationDeadline')) {
      result.applicationDeadline = date(body.applicationDeadline, 'applicationDeadline');
      if (
        req.method === 'POST' &&
        result.applicationDeadline &&
        result.applicationDeadline <= new Date()
      ) throw invalid('applicationDeadline must be in the future.');
    }
    req.validatedJob = result;
    next();
  } catch (error) {
    next(error);
  }
}

export function validateJobId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.jobId)) {
    next(invalid('Job ID is invalid.'));
    return;
  }
  next();
}
