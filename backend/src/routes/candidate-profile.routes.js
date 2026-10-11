import { Router } from 'express';
import multer from 'multer';

import {
  editProfile,
  readProfile,
  uploadCandidateProfilePhoto,
} from '../controllers/candidate-profile.controller.js';

import {
  downloadOwnResume,
  readResume,
  uploadResume,
} from '../controllers/resume.controller.js';

import {
  authenticate,
  requireSameOrigin,
} from '../middleware/auth.middleware.js';

import {
  validateCandidateProfileUpdate,
} from '../middleware/candidate-profile-validation.middleware.js';

import { authorize } from '../middleware/role.middleware.js';

import { RESUME_MIME_TYPES } from '../services/resume-extraction.service.js';

const candidateProfileRouter = Router();

const MAX_PROFILE_PHOTO_SIZE = 3 * 1024 * 1024;
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const profilePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PROFILE_PHOTO_SIZE,
    files: 1,
    fields: 0,
    parts: 1,
  },
  fileFilter(req, file, callback) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error(
        'Profile photos must be JPG, PNG, or WebP images.',
      );
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_SIZE,
    files: 1,
    fields: 0,
    parts: 1,
  },
  fileFilter(req, file, callback) {
    const extension = file.originalname
      .split('.')
      .pop()
      ?.toLocaleLowerCase('en');

    const expectedMime =
      extension === 'pdf'
        ? RESUME_MIME_TYPES.pdf
        : extension === 'docx'
          ? RESUME_MIME_TYPES.docx
          : null;

    if (!expectedMime || file.mimetype !== expectedMime) {
      const error = new Error(
        'Resume must be a PDF or DOCX document with a matching file type.',
      );
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

function receiveProfilePhoto(req, res, next) {
  profilePhotoUpload.single('profilePhoto')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        const message =
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Profile photos must be no larger than 3 MB.'
            : 'The profile photo upload is invalid. Please try again.';

        res.status(400).json({
          error: { message },
        });
        return;
      }

      res.status(error.statusCode || 400).json({
        error: {
          message: error.message || 'Could not process the profile photo.',
        },
      });
      return;
    }

    next();
  });
}

function receiveResume(req, res, next) {
  resumeUpload.single('resume')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        error.statusCode =
          error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        if (error.code === 'LIMIT_FILE_SIZE') {
          error.message = 'Resume must be no larger than 5 MB.';
        }
      }

      next(error);
      return;
    }

    next();
  });
}

// Preserve the original security checks for every route.
candidateProfileRouter.use(
  requireSameOrigin,
  authenticate,
  authorize('candidate'),
);

// Read and update the candidate profile.
candidateProfileRouter.get('/', readProfile);

candidateProfileRouter.patch(
  '/',
  validateCandidateProfileUpdate,
  editProfile,
);

// Upload or replace the candidate profile photo.
candidateProfileRouter.post(
  '/photo',
  receiveProfilePhoto,
  uploadCandidateProfilePhoto,
);

// Read and download the candidate resume.
candidateProfileRouter.get('/resume', readResume);
candidateProfileRouter.get('/resume/file', downloadOwnResume);

// Upload the candidate resume.
candidateProfileRouter.post(
  '/resume',
  receiveResume,
  uploadResume,
);

export default candidateProfileRouter;