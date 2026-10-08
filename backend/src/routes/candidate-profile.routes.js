import { Router } from 'express';
import { editProfile, readProfile } from '../controllers/candidate-profile.controller.js';
import { downloadOwnResume, readResume, uploadResume } from '../controllers/resume.controller.js';
import { authenticate, requireSameOrigin } from '../middleware/auth.middleware.js';
import { validateCandidateProfileUpdate } from '../middleware/candidate-profile-validation.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import multer from 'multer';
import { RESUME_MIME_TYPES } from '../services/resume-extraction.service.js';

const candidateProfileRouter = Router();
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter(req, file, callback) {
    const extension = file.originalname.split('.').pop()?.toLocaleLowerCase('en');
    const expectedMime = extension === 'pdf'
      ? RESUME_MIME_TYPES.pdf
      : extension === 'docx'
        ? RESUME_MIME_TYPES.docx
        : null;
    if (!expectedMime || file.mimetype !== expectedMime) {
      const error = new Error('Resume must be a PDF or DOCX document with a matching file type.');
      error.statusCode = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

function receiveResume(req, res, next) {
  resumeUpload.single('resume')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        error.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        if (error.code === 'LIMIT_FILE_SIZE') error.message = 'Resume must be no larger than 5 MB.';
      }
      next(error);
      return;
    }
    next();
  });
}

candidateProfileRouter.use(requireSameOrigin, authenticate, authorize('candidate'));
candidateProfileRouter.get('/', readProfile);
candidateProfileRouter.patch('/', validateCandidateProfileUpdate, editProfile);
candidateProfileRouter.get('/resume', readResume);
candidateProfileRouter.get('/resume/file', downloadOwnResume);
candidateProfileRouter.post('/resume', receiveResume, uploadResume);

export default candidateProfileRouter;
