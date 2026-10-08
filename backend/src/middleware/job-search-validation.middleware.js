import mongoose from 'mongoose';
import { EMPLOYMENT_TYPES } from '../models/enums.js';

const ALLOWED_QUERY_FIELDS = new Set([
  'q',
  'title',
  'skill',
  'location',
  'employmentType',
  'minExperience',
  'maxExperience',
  'minSalary',
  'maxSalary',
  'salaryCurrency',
  'sort',
  'page',
  'limit',
]);

const TRACKING_QUERY_FIELDS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
]);

const SORTS = new Set(['newest', 'salary', 'relevance']);

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function parseText(value, field, maxLength) {
  if (value === undefined) return undefined;

  if (typeof value !== 'string') {
    throw invalid(`${field} must be a string.`);
  }

  const parsed = value.trim();

  if (parsed.length > maxLength) {
    throw invalid(`${field} cannot exceed ${maxLength} characters.`);
  }

  if (/[<>]/.test(parsed)) {
    throw invalid(`${field} contains unsupported characters.`);
  }

  return parsed || undefined;
}

function parseNumber(value, field, { maximum = 1_000_000_000 } = {}) {
  if (value === undefined || value === '') return undefined;

  if (
    typeof value !== 'string' ||
    !/^\d+(?:\.\d{1,2})?$/.test(value)
  ) {
    throw invalid(`${field} must be a non-negative number.`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed > maximum) {
    throw invalid(`${field} must not exceed ${maximum}.`);
  }

  return parsed;
}

function parseInteger(value, field, minimum, maximum, fallback) {
  if (value === undefined) return fallback;

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw invalid(`${field} must be a whole number.`);
  }

  const parsed = Number(value);

  if (parsed < minimum || parsed > maximum) {
    throw invalid(`${field} must be between ${minimum} and ${maximum}.`);
  }

  return parsed;
}

function parseSkill(value) {
  const entries = Array.isArray(value)
    ? value
    : value === undefined
      ? []
      : [value];

  if (entries.length > 10) {
    throw invalid('skill can contain no more than 10 values.');
  }

  return [
    ...new Set(
      entries
        .map((item) =>
          parseText(item, 'skill', 100)?.toLocaleLowerCase('en'),
        )
        .filter(Boolean),
    ),
  ];
}

export function validateJobSearch(req, res, next) {
  try {
    for (const key of Object.keys(req.query)) {
      // Tracking parameters are not job-search filters.
      // Ignore them instead of passing them to the search logic.
      if (TRACKING_QUERY_FIELDS.has(key)) {
        continue;
      }

      if (!ALLOWED_QUERY_FIELDS.has(key)) {
        throw invalid(`Unexpected search filter: ${key}.`);
      }

      if (
        Array.isArray(req.query[key]) &&
        key !== 'skill'
      ) {
        throw invalid(`${key} must be provided once.`);
      }
    }

    const filters = {
      q: parseText(req.query.q, 'q', 120),

      title: parseText(
        req.query.title,
        'title',
        120,
      ),

      skill: parseSkill(req.query.skill),

      location: parseText(
        req.query.location,
        'location',
        120,
      ),

      employmentType: parseText(
        req.query.employmentType,
        'employmentType',
        30,
      ),

      minExperience: parseNumber(
        req.query.minExperience,
        'minExperience',
        { maximum: 80 },
      ),

      maxExperience: parseNumber(
        req.query.maxExperience,
        'maxExperience',
        { maximum: 80 },
      ),

      minSalary: parseNumber(
        req.query.minSalary,
        'minSalary',
      ),

      maxSalary: parseNumber(
        req.query.maxSalary,
        'maxSalary',
      ),

      salaryCurrency: parseText(
        req.query.salaryCurrency,
        'salaryCurrency',
        3,
      )?.toUpperCase(),

      sort:
        req.query.sort === undefined
          ? 'newest'
          : parseText(
              req.query.sort,
              'sort',
              20,
            ),

      page: parseInteger(
        req.query.page,
        'page',
        1,
        1_000_000,
        1,
      ),

      limit: parseInteger(
        req.query.limit,
        'limit',
        1,
        50,
        12,
      ),
    };

    if (
      filters.employmentType &&
      !EMPLOYMENT_TYPES.includes(filters.employmentType)
    ) {
      throw invalid('employmentType is invalid.');
    }

    if (
      filters.sort &&
      !SORTS.has(filters.sort)
    ) {
      throw invalid(
        'sort must be newest, salary, or relevance.',
      );
    }

    if (
      filters.salaryCurrency &&
      !/^[A-Z]{3}$/.test(filters.salaryCurrency)
    ) {
      throw invalid(
        'salaryCurrency must be a three-letter currency code.',
      );
    }

    if (
      filters.minExperience !== undefined &&
      filters.maxExperience !== undefined &&
      filters.minExperience > filters.maxExperience
    ) {
      throw invalid(
        'minExperience cannot exceed maxExperience.',
      );
    }

    if (
      filters.minSalary !== undefined &&
      filters.maxSalary !== undefined &&
      filters.minSalary > filters.maxSalary
    ) {
      throw invalid(
        'minSalary cannot exceed maxSalary.',
      );
    }

    if (
      filters.sort === 'relevance' &&
      !filters.q
    ) {
      throw invalid(
        'sort=relevance requires a q search term.',
      );
    }

    if (
      filters.sort === 'relevance' &&
      filters.q.length < 2
    ) {
      throw invalid(
        'q must contain at least 2 characters for relevance sorting.',
      );
    }

    req.jobSearchFilters = filters;

    next();
  } catch (error) {
    next(error);
  }
}

export function validatePublicJobId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.jobId)) {
    next(invalid('Job ID is invalid.'));
    return;
  }

  next();
}