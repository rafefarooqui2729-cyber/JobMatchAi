import { Router } from 'express';
import {
  listRecommendations,
  listCandidateApplications,
  listCandidateSavedJobs,
  readCandidateApplication,
  readRecommendationMatch,
  removeSavedJob,
  saveRecommendedJob,
  submitJobApplication,
  validJobId,
} from '../controllers/recommendation.controller.js';
import { authenticate, requireSameOrigin } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { downloadCandidateApplicationResume } from '../controllers/resume.controller.js';

const recommendationRouter = Router();
recommendationRouter.use(requireSameOrigin, authenticate, authorize('candidate'));
recommendationRouter.get('/recommendations', listRecommendations);
recommendationRouter.get('/applications', listCandidateApplications);
recommendationRouter.get('/applications/:applicationId', readCandidateApplication);
recommendationRouter.get('/applications/:applicationId/resume', downloadCandidateApplicationResume);
recommendationRouter.get('/saved-jobs', listCandidateSavedJobs);
recommendationRouter.get('/recommendations/:jobId', validJobId, readRecommendationMatch);
recommendationRouter.put('/saved-jobs/:jobId', validJobId, saveRecommendedJob);
recommendationRouter.delete('/saved-jobs/:jobId', validJobId, removeSavedJob);
recommendationRouter.post('/jobs/:jobId/applications', validJobId, submitJobApplication);

export default recommendationRouter;
