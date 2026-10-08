import mongoose from 'mongoose';
import { EDUCATION_LEVELS, PROFICIENCY_LEVELS } from './enums.js';

const { Schema } = mongoose;

const candidateSkillSchema = new Schema(
  {
    skill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    proficiency: {
      type: String,
      enum: PROFICIENCY_LEVELS,
      default: 'intermediate',
    },
    yearsExperience: {
      type: Number,
      min: 0,
      max: 80,
      default: 0,
    },
  },
  { _id: false },
);

const educationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true, maxlength: 200 },
    degree: { type: String, trim: true, maxlength: 160 },
    fieldOfStudy: { type: String, trim: true, maxlength: 160 },
    level: { type: String, enum: EDUCATION_LEVELS, required: true },
    startYear: { type: Number, min: 1950, max: 2100 },
    endYear: { type: Number, min: 1950, max: 2100 },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: true },
);

const experienceSchema = new Schema(
  {
    employer: { type: String, required: true, trim: true, maxlength: 200 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 200 },
    startDate: { type: Date, required: true },
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 4000 },
    skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
  },
  { _id: true },
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 4000 },
    url: { type: String, trim: true, maxlength: 2048 },
    githubUrl: { type: String, trim: true, maxlength: 2048 },
    startDate: Date,
    endDate: Date,
    skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
  },
  { _id: true },
);

const certificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, trim: true, maxlength: 200 },
    issuedAt: Date,
    expiresAt: Date,
    credentialUrl: { type: String, trim: true, maxlength: 2048 },
  },
  { _id: true },
);

const preferredLocationSchema = new Schema(
  {
    city: { type: String, trim: true, maxlength: 120 },
    region: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 120 },
    countryCode: { type: String, trim: true, uppercase: true, maxlength: 2 },
    remoteType: { type: String, enum: ['onsite', 'hybrid', 'remote'] },
  },
  { _id: false },
);

const personalLocationSchema = new Schema(
  {
    city: { type: String, trim: true, maxlength: 120 },
    region: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 120 },
    countryCode: { type: String, trim: true, uppercase: true, maxlength: 2 },
  },
  { _id: false },
);

const candidateProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 32 },
    location: { type: personalLocationSchema, default: () => ({}) },
    headline: { type: String, trim: true, maxlength: 180 },
    summary: { type: String, trim: true, maxlength: 4000 },
    skills: { type: [candidateSkillSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    preferredRoles: {
      type: [{ type: String, trim: true, maxlength: 160 }],
      default: [],
    },
    preferredLocations: { type: [preferredLocationSchema], default: [] },
    preferredEmploymentTypes: {
      type: [{ type: String, enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship'] }],
      default: [],
    },
    resume: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    profileVisibility: {
      type: String,
      enum: ['private', 'employers'],
      default: 'employers',
    },
  },
  { timestamps: true },
);

candidateProfileSchema.index({ 'skills.skill': 1 });
candidateProfileSchema.index({ preferredRoles: 1 });

const CandidateProfile =
  mongoose.models.CandidateProfile ||
  mongoose.model('CandidateProfile', candidateProfileSchema);

export default CandidateProfile;
