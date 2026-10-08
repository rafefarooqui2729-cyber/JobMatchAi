import { Router } from 'express';
import { readPublicJob, searchJobs } from '../controllers/job-discovery.controller.js';
import {
  validateJobSearch,
  validatePublicJobId,
} from '../middleware/job-search-validation.middleware.js';

const jobDiscoveryRouter = Router();

jobDiscoveryRouter.get('/', validateJobSearch, searchJobs);
jobDiscoveryRouter.get('/:jobId', validatePublicJobId, readPublicJob);

export default jobDiscoveryRouter;
