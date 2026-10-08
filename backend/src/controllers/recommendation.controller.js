import mongoose from 'mongoose';
import {
  applyForJob,
  getCandidateApplication,
  getJobMatchDetails,
  getRecommendations,
  listApplicationsForCandidate,
  listSavedJobsForCandidate,
  saveJobForCandidate,
  unsaveJobForCandidate,
} from '../services/recommendation.service.js';

function validJobId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.jobId)) {
    res.status(400).json({ error: { message: 'A valid job ID is required.' } });
    return;
  }
  next();
}

function paginationValue(value, fallback, maximum) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= maximum ? parsed : null;
}

export async function listCandidateApplications(req, res, next) {
  try {
    res.status(200).json({ applications: await listApplicationsForCandidate(req.auth.id) });
  } catch (error) {
    next(error);
  }
}

export async function readCandidateApplication(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.applicationId)) {
    res.status(400).json({ error: { message: 'A valid application ID is required.' } });
    return;
  }
  try {
    const application = await getCandidateApplication(req.auth.id, req.params.applicationId);
    if (!application) {
      res.status(404).json({ error: { message: 'Application was not found.' } });
      return;
    }
    res.status(200).json({ application });
  } catch (error) {
    next(error);
  }
}

export async function listCandidateSavedJobs(req, res, next) {
  const page = paginationValue(req.query.page, 1, 100000);
  const limit = paginationValue(req.query.limit, 20, 50);
  if (!page || !limit) {
    res.status(400).json({ error: { message: 'Page must be positive and limit must be between 1 and 50.' } });
    return;
  }
  try {
    res.status(200).json(await listSavedJobsForCandidate(req.auth.id, { page, limit }));
  } catch (error) {
    next(error);
  }
}

export async function listRecommendations(req, res, next) {
  const rawLimit = req.query.limit;
  if (rawLimit !== undefined && (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 50)) {
    res.status(400).json({ error: { message: 'Limit must be a whole number between 1 and 50.' } });
    return;
  }
  try {
    res.status(200).json(await getRecommendations(req.auth.id, rawLimit === undefined ? 20 : Number(rawLimit)));
  } catch (error) {
    next(error);
  }
}

export async function readRecommendationMatch(req, res, next) {
  try {
    const recommendation = await getJobMatchDetails(req.auth.id, req.params.jobId);
    if (!recommendation) {
      res.status(404).json({ error: { message: 'An active job was not found.' } });
      return;
    }
    res.status(200).json({ recommendation });
  } catch (error) {
    next(error);
  }
}

export async function saveRecommendedJob(req, res, next) {
  try {
    const result = await saveJobForCandidate(req.auth.id, req.params.jobId);
    if (!result) {
      res.status(404).json({ error: { message: 'An active job was not found.' } });
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function removeSavedJob(req, res, next) {
  try {
    res.status(200).json(await unsaveJobForCandidate(req.auth.id, req.params.jobId));
  } catch (error) {
    next(error);
  }
}

export async function submitJobApplication(req, res, next) {
  try {
    const result = await applyForJob(req.auth.id, req.params.jobId);
    if (!result) {
      res.status(404).json({ error: { message: 'This job is no longer accepting applications.' } });
      return;
    }
    res.status(201).json({ application: result });
  } catch (error) {
    next(error);
  }
}

export { validJobId };
