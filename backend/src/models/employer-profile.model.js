import mongoose from 'mongoose';

const { Schema } = mongoose;

const employerProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    jobTitle: { type: String, trim: true, maxlength: 160 },
    companyRole: {
      type: String,
      enum: ['owner', 'admin', 'recruiter', 'hiring-manager'],
      default: 'recruiter',
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

employerProfileSchema.index({ company: 1 });

const EmployerProfile =
  mongoose.models.EmployerProfile ||
  mongoose.model('EmployerProfile', employerProfileSchema);

export default EmployerProfile;
