import mongoose from 'mongoose';
import { APPLICATION_STATUSES } from './enums.js';

const { Schema } = mongoose;

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false },
);

const applicationSchema = new Schema(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'submitted',
      required: true,
    },
    coverLetter: { type: String, trim: true, maxlength: 10000 },
    resume: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    matchScore: { type: Number, min: 0, max: 100 },
    statusUpdatedAt: { type: Date, default: Date.now },
    withdrawnAt: { type: Date, default: null },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

applicationSchema.index({ candidate: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1, createdAt: -1 });
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

const Application =
  mongoose.models.Application || mongoose.model('Application', applicationSchema);

export default Application;
