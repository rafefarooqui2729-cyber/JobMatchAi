import mongoose from 'mongoose';

const { Schema } = mongoose;

const categoryScoresSchema = new Schema(
  {
    skills: { type: Number, min: 0, max: 100, required: true },
    experience: { type: Number, min: 0, max: 100, required: true },
    education: { type: Number, min: 0, max: 100, required: true },
    projects: { type: Number, min: 0, max: 100, required: true },
    location: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false },
);

const recommendationSchema = new Schema(
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
    score: { type: Number, min: 0, max: 100, required: true },
    categoryScores: { type: categoryScoresSchema, required: true },
    matchedSkills: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
      default: [],
    },
    missingSkills: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
      default: [],
    },
    explanation: { type: String, required: true, trim: true, maxlength: 4000 },
    scoringVersion: { type: String, required: true, trim: true, maxlength: 40 },
    calculatedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

recommendationSchema.index({ candidate: 1, score: -1, calculatedAt: -1 });
recommendationSchema.index({ job: 1, score: -1 });
recommendationSchema.index({ candidate: 1, job: 1 }, { unique: true });

const Recommendation =
  mongoose.models.Recommendation ||
  mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
