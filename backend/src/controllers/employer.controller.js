import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import {
  closeEmployerJob,
  createEmployerJob,
  deleteEmployerJob,
  getEmployerCompany,
  getEmployerJob,
  imageMimeFromBytes,
  listEmployerJobs,
  listApplicantsForJob,
  getEmployerApplication,
  publishEmployerJob,
  updateCompanyLogo,
  updateEmployerApplicationStatus,
  updateEmployerCompany,
  updateEmployerJob,
} from '../services/employer.service.js';
import { schedulePublishedJobRecommendations } from '../services/recommendation.service.js';
import Job from '../models/job.model.js';
import { downloadApplicantResume as streamApplicantResume } from './resume.controller.js';

export async function readCompany(req, res, next) {
  try {
    res.status(200).json({ company: await getEmployerCompany(req.auth.id) });
  } catch (error) {
    next(error);
  }
}

export async function editCompany(req, res, next) {
  try {
    res.status(200).json({ company: await updateEmployerCompany(req.auth.id, req.validatedCompany) });
  } catch (error) {
    next(error);
  }
}

export async function uploadCompanyLogo(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('Choose an image file to upload.');
      error.statusCode = 400;
      throw error;
    }
    const detectedMimeType = imageMimeFromBytes(req.file.buffer);
    if (!detectedMimeType || detectedMimeType !== req.file.mimetype) {
      const error = new Error('Logo content must match a valid PNG, JPEG, or WebP image.');
      error.statusCode = 400;
      throw error;
    }
    const company = await updateCompanyLogo(req.auth.id, { ...req.file, detectedMimeType });
    res.status(200).json({ company });
  } catch (error) {
    next(error);
  }
}

export async function listJobs(req, res, next) {
  try {
    res.status(200).json({ jobs: await listEmployerJobs(req.auth.id) });
  } catch (error) {
    next(error);
  }
}

function applicantPagination(req, res) {
  const parse = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const number = Number(value);
    return number >= 1 && number <= max ? number : null;
  };
  const page = parse(req.query.page, 1, 100000);
  const limit = parse(req.query.limit, 20, 50);
  const status = req.query.status;
  if (!page || !limit || (status !== undefined && !['submitted', 'under-review', 'shortlisted', 'rejected', 'withdrawn', 'hired'].includes(status))) {
    res.status(400).json({ error: { message: 'Invalid applicant page, limit, or status filter.' } });
    return null;
  }
  return { page, limit, status };
}

export async function listApplicants(req, res, next) {
  const pagination = applicantPagination(req, res);
  if (!pagination) return;
  try {
    const result = await listApplicantsForJob(req.auth.id, req.params.jobId, pagination);
    if (!result) {
      res.status(404).json({ error: { message: 'Job was not found.' } });
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function readEmployerApplication(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.applicationId)) {
    res.status(400).json({ error: { message: 'A valid application ID is required.' } });
    return;
  }
  try {
    const application = await getEmployerApplication(req.auth.id, req.params.applicationId);
    if (!application) {
      res.status(404).json({ error: { message: 'Application was not found.' } });
      return;
    }
    res.status(200).json({ application });
  } catch (error) {
    next(error);
  }
}

export function downloadApplicantResume(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.applicationId)) {
    res.status(400).json({ error: { message: 'A valid application ID is required.' } });
    return;
  }
  return streamApplicantResume(req, res, next);
}

export async function readJob(req, res, next) {
  try {
    const job = await getEmployerJob(req.auth.id, req.params.jobId);
    if (!job) {
      res.status(404).json({ error: { message: 'Job was not found.' } });
      return;
    }
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const job = await createEmployerJob(req.auth.id, req.validatedJob);
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
}

export async function editJob(req, res, next) {
  try {
    const job = await updateEmployerJob(req.auth.id, req.params.jobId, req.validatedJob);
    if (!job) {
      res.status(404).json({ error: { message: 'Job was not found.' } });
      return;
    }
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}

export async function removeJob(req, res, next) {
  try {
    const removed = await deleteEmployerJob(req.auth.id, req.params.jobId);
    if (!removed) {
      res.status(404).json({ error: { message: 'Job was not found.' } });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function changeJobStatus(req, res, next, update) {
  try {
    const job = await update(req.auth.id, req.params.jobId);
    if (!job) {
      res.status(404).json({ error: { message: 'Job was not found.' } });
      return;
    }
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}

export async function publishJob(req, res, next) {
  try {
    const existing = await Job.findOne({ _id: req.params.jobId, employer: req.auth.id }).select('status');
    const job = await publishEmployerJob(req.auth.id, req.params.jobId);
    if (!job) {
      res.status(404).json({ error: { message: 'Job was not found.' } });
      return;
    }
    if (existing?.status !== 'published') schedulePublishedJobRecommendations(req.params.jobId);
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}

export function closeJob(req, res, next) {
  return changeJobStatus(req, res, next, closeEmployerJob);
}

export async function changeApplicationStatus(req, res, next) {
  try {
    const result = await updateEmployerApplicationStatus(req.auth.id, req.params.applicationId, req.body.status);
    if (!result) {
      res.status(404).json({ error: { message: 'Application was not found.' } });
      return;
    }
    res.status(200).json({ application: result.application });
  } catch (error) {
    next(error);
  }
}

export function validateApplicationUpdate(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.applicationId)) {
    res.status(400).json({ error: { message: 'A valid application ID is required.' } });
    return;
  }
  if (!['under-review', 'shortlisted', 'rejected', 'hired'].includes(req.body?.status)) {
    res.status(400).json({ error: { message: 'Status must be under-review, shortlisted, rejected, or hired.' } });
    return;
  }
  next();
}
