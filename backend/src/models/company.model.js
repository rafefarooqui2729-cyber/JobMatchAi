import mongoose from 'mongoose';

const { Schema } = mongoose;

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 220,
    },
    description: { type: String, trim: true, maxlength: 5000 },
    website: { type: String, trim: true, maxlength: 2048 },
    industry: { type: String, trim: true, maxlength: 120 },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown'],
      default: 'unknown',
    },
    logoUrl: { type: String, trim: true, maxlength: 2048 },
    logoStorageKey: { type: String, trim: true, maxlength: 500 },
    headquarters: {
      city: { type: String, trim: true, maxlength: 120 },
      region: { type: String, trim: true, maxlength: 120 },
      country: { type: String, trim: true, maxlength: 120 },
      countryCode: { type: String, trim: true, uppercase: true, maxlength: 2 },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

companySchema.index({ slug: 1 }, { unique: true });
companySchema.index({ name: 1 });

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export default Company;
