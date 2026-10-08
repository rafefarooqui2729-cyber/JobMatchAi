import {
  getPublishedJob,
  searchPublishedJobs,
} from '../services/job-discovery.service.js';

export async function searchJobs(req, res, next) {
  try {
    res.status(200).json(await searchPublishedJobs(req.jobSearchFilters));
  } catch (error) {
    next(error);
  }
}

export async function readPublicJob(req, res, next) {
  try {
    const job = await getPublishedJob(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: { message: 'Published job was not found.' } });
      return;
    }
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}
