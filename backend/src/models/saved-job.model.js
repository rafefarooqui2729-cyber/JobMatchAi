import mongoose from 'mongoose';

const { Schema } = mongoose;

const savedJobSchema = new Schema(
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
  },
  { timestamps: true },
);

savedJobSchema.index({ candidate: 1, job: 1 }, { unique: true });
savedJobSchema.index({ candidate: 1, createdAt: -1 });

const SavedJob = mongoose.models.SavedJob || mongoose.model('SavedJob', savedJobSchema);

export default SavedJob;
