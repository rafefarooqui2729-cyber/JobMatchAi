import mongoose from 'mongoose';
import { SKILL_CATEGORIES } from './enums.js';

const { Schema } = mongoose;

const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    aliases: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 100 }],
      default: [],
    },
    category: {
      type: String,
      enum: SKILL_CATEGORIES,
      default: 'technical',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

skillSchema.index({ normalizedName: 1 }, { unique: true });
skillSchema.index({ aliases: 1 });
skillSchema.index({ category: 1, isActive: 1 });

const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);

export default Skill;
