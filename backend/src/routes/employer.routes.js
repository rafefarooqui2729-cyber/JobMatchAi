import { Router } from 'express';
import multer from 'multer';
import {
  closeJob,
  changeApplicationStatus,
  createJob,
  editCompany,
  editJob,
  listJobs,
  listApplicants,
  readEmployerApplication,
  downloadApplicantResume,
  publishJob,
  readCompany,
  readJob,
  removeJob,
  uploadCompanyLogo,
  validateApplicationUpdate,
} from '../controllers/employer.controller.js';
import { authenticate, requireSameOrigin } from '../middleware/auth.middleware.js';
import {
  validateCompanyUpdate,
  validateJob,
  validateJobId,
} from '../middleware/employer-validation.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const employerRouter = Router();
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter(req, file, callback) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
      const error = new Error('Logo must be a PNG, JPEG, or WebP image no larger than 3 MB.');
      error.statusCode = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

employerRouter.use(requireSameOrigin, authenticate, authorize('employer'));
employerRouter.get('/company', readCompany);
employerRouter.patch('/company', validateCompanyUpdate, editCompany);
employerRouter.post('/company/logo', (req, res, next) => {
  logoUpload.single('logo')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) error.statusCode = 400;
      next(error);
      return;
    }
    next();
  });
}, uploadCompanyLogo);

employerRouter.get('/jobs', listJobs);
employerRouter.get('/jobs/:jobId/applications', validateJobId, listApplicants);
employerRouter.get('/applications/:applicationId', readEmployerApplication);
employerRouter.get('/applications/:applicationId/resume', downloadApplicantResume);
employerRouter.post('/jobs', validateJob, createJob);
employerRouter.get('/jobs/:jobId', validateJobId, readJob);
employerRouter.patch('/jobs/:jobId', validateJobId, validateJob, editJob);
employerRouter.delete('/jobs/:jobId', validateJobId, removeJob);
employerRouter.post('/jobs/:jobId/publish', validateJobId, publishJob);
employerRouter.post('/jobs/:jobId/close', validateJobId, closeJob);
employerRouter.patch('/applications/:applicationId/status', validateApplicationUpdate, changeApplicationStatus);

export default employerRouter;
