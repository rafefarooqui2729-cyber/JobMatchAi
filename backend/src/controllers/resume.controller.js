import { createReadStream } from 'node:fs';
import {
  getApplicantResumeDownload,
  getCandidateApplicationResumeDownload,
  getCandidateResume,
  getOwnResumeDownload,
  uploadAndParseResume,
} from '../services/resume.service.js';
import { emitUpdatedRecommendations } from '../services/recommendation.service.js';
import mongoose from 'mongoose';

export async function readResume(req, res, next) {
  try {
    const resume = await getCandidateResume(req.auth.id);
    res.status(200).json({ resume });
  } catch (error) {
    next(error);
  }
}

export async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('Choose a PDF or DOCX resume to upload.');
      error.statusCode = 400;
      throw error;
    }
    const result = await uploadAndParseResume(req.auth.id, req.file);
    await emitUpdatedRecommendations(req.auth.id, 'resume');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

function streamResume(req, res, next, getDownload) {
  getDownload()
    .then((download) => {
      if (!download) {
        res.status(404).json({ error: { message: 'Resume is unavailable or you are not authorized to access it.' } });
        return;
      }
      const filename = encodeURIComponent(download.originalName);
      res.set({
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="resume"; filename*=UTF-8''${filename}`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Type': download.mimeType,
      });
      const stream = createReadStream(download.path);
      stream.on('error', (error) => {
        if (res.headersSent) res.destroy(error);
        else next(error);
      });
      stream.pipe(res);
    })
    .catch(next);
}

export function downloadOwnResume(req, res, next) {
  streamResume(req, res, next, () => getOwnResumeDownload(req.auth.id));
}

export function downloadApplicantResume(req, res, next) {
  streamResume(req, res, next, () => getApplicantResumeDownload(req.auth.id, req.params.applicationId));
}

export function downloadCandidateApplicationResume(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.applicationId)) {
    res.status(400).json({ error: { message: 'A valid application ID is required.' } });
    return;
  }
  streamResume(req, res, next, () => getCandidateApplicationResumeDownload(req.auth.id, req.params.applicationId));
}
