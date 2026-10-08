import mongoose from 'mongoose';
import { RESUME_STATUSES } from './enums.js';

const { Schema } = mongoose;

const extractedSkillSchema = new Schema(
  {
    skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false },
);

const resumeModelSchema = new Schema(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storageKey: { type: String, required: true, trim: true, maxlength: 500 },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },
    sizeBytes: { type: Number, required: true, min: 1 },
    sha256: { type: String, trim: true, lowercase: true, match: /^[a-f0-9]{64}$/ },
    status: {
      type: String,
      enum: RESUME_STATUSES,
      default: 'uploaded',
      required: true,
    },
    parserVersion: { type: String, trim: true, maxlength: 80 },
    extractedSkills: { type: [extractedSkillSchema], default: [] },
    parsedAt: { type: Date, default: null },
    failureCode: { type: String, trim: true, maxlength: 80 },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true },
);

resumeModelSchema.index({ candidate: 1, createdAt: -1 });
resumeModelSchema.index(
  { candidate: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } },
);
resumeModelSchema.index({ sha256: 1 }, { sparse: true });

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeModelSchema);

export default Resume;
