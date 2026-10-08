import mongoose from 'mongoose';
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  REMOTE_TYPES,
  SALARY_PERIODS,
} from './enums.js';

const { Schema } = mongoose;

const jobLocationSchema = new Schema(
  {
    city: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    region: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    country: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 2,
    },

    remoteType: {
      type: String,
      enum: REMOTE_TYPES,
      default: 'onsite',
    },
  },
  { _id: false },
);

const salarySchema = new Schema(
  {
    minimum: {
      type: Number,
      min: 0,
    },

    maximum: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },

    period: {
      type: String,
      enum: SALARY_PERIODS,
      default: 'year',
    },

    isDisclosed: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const educationRequirementSchema = new Schema(
  {
    minimumLevel: {
      type: String,
      enum: EDUCATION_LEVELS,
    },

    fieldsOfStudy: [
      {
        type: String,
        trim: true,
        maxlength: 160,
      },
    ],

    isRequired: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const jobSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },

    // Required for platform-created jobs.
    // External jobs do not have an internal Company document.
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: function requiredPlatformCompany() {
        return this.source === 'platform';
      },
    },

    // Required for platform-created jobs.
    // External jobs do not belong to an internal employer account.
    employer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function requiredPlatformEmployer() {
        return this.source === 'platform';
      },
    },

    // Human-readable company name for external jobs.
    companyName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    location: {
      type: jobLocationSchema,
      required: true,
    },

    employmentType: {
      type: String,
      required: true,
      enum: EMPLOYMENT_TYPES,
    },

    salary: {
      type: salarySchema,
      default: () => ({}),
    },

    requiredSkills: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Skill',
        },
      ],
      default: [],
    },

    preferredSkills: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Skill',
        },
      ],
      default: [],
    },

    minimumExperience: {
      type: Number,
      min: 0,
      max: 80,
      default: 0,
    },

    maximumExperience: {
      type: Number,
      min: 0,
      max: 80,
    },

    educationRequirements: {
      type: [educationRequirementSchema],
      default: [],
    },

    responsibilities: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 1000,
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: JOB_STATUSES,
      default: 'draft',
      required: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    applicationDeadline: {
      type: Date,
      default: null,
    },

    // ==========================================
    // EXTERNAL JOB SOURCE FIELDS
    // ==========================================

    source: {
      type: String,
      enum: ['platform', 'external'],
      default: 'platform',
      index: true,
    },

    provider: {
      type: String,
      default: null,
      index: true,
    },

    sourceJobId: {
      type: String,
      default: null,
    },

    sourceUrl: {
      type: String,
      default: null,
    },

    externalApplyUrl: {
      type: String,
      default: null,
    },

    isExternal: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },

    externalExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

// ==========================================
// INDEXES
// ==========================================

jobSchema.index({
  status: 1,
  createdAt: -1,
});

jobSchema.index({
  company: 1,
  status: 1,
});

jobSchema.index({
  employer: 1,
  status: 1,
});

jobSchema.index({
  requiredSkills: 1,
});

jobSchema.index({
  'location.countryCode': 1,
  'location.city': 1,
});

jobSchema.index({
  employmentType: 1,
  status: 1,
  createdAt: -1,
});

jobSchema.index({
  'salary.minimum': 1,
  status: 1,
});

jobSchema.index({
  'salary.maximum': 1,
  status: 1,
});

jobSchema.index({
  minimumExperience: 1,
  maximumExperience: 1,
  status: 1,
});

jobSchema.index({
  status: 1,
  publishedAt: -1,
  _id: -1,
});

jobSchema.index({
  title: 'text',
  description: 'text',
});

// Prevent duplicate external jobs from the same provider.
jobSchema.index(
  {
    provider: 1,
    sourceJobId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isExternal: true,
      provider: {
        $type: 'string',
      },
      sourceJobId: {
        $type: 'string',
      },
    },
  },
);

// ==========================================
// VALIDATION
// ==========================================

jobSchema.pre('validate', function validateJob() {
  if (
    this.maximumExperience != null &&
    this.maximumExperience < this.minimumExperience
  ) {
    this.invalidate(
      'maximumExperience',
      'Maximum experience must be greater than or equal to minimum experience.',
    );
  }

  if (
    this.salary?.minimum != null &&
    this.salary?.maximum != null &&
    this.salary.maximum < this.salary.minimum
  ) {
    this.invalidate(
      'salary.maximum',
      'Maximum salary must be greater than or equal to minimum salary.',
    );
  }

  // Keep source and isExternal consistent.
  if (this.source === 'external') {
    this.isExternal = true;
  }

  if (this.source === 'platform') {
    this.isExternal = false;
  }
});

const Job =
  mongoose.models.Job ||
  mongoose.model('Job', jobSchema);

export default Job;