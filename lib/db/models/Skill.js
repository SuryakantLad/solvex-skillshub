/**
 * lib/db/models/Skill.js
 * Global normalized skills catalog.
 *
 * This model is the authoritative registry of skill names. Employee `skills`
 * arrays store their own embedded sub-documents (for performance), but HR
 * analytics, auto-complete, and AI tagging all query this catalog for
 * consistent naming, aliases, and relationships.
 *
 * Relationships:
 *   - Employee.skills[].name  →  loosely matches Skill.name (no FK — embedded doc)
 *   - Skill.relatedSkills[]   →  self-referential via ObjectId refs
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Skill Category Enum (single source of truth for the whole app) ───────────
export const SKILL_CATEGORIES = [
  'Frontend',
  'Backend',
  'Database',
  'Cloud',
  'DevOps',
  'Mobile',
  'AI/ML',
  'Design',
  'Management',
  'Security',
  'Data',
  'QA',
  'Blockchain',
  'Other',
];

export const SKILL_TREND = ['growing', 'stable', 'declining', 'emerging'];

// ─── Schema ───────────────────────────────────────────────────────────────────
const SkillCatalogSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    /** Canonical lowercase-normalised name used as the unique key */
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [80, 'Skill name too long'],
    },
    /** URL-safe identifier — e.g. "react-js", "aws-lambda" */
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'],
    },
    /** Human-readable display name with correct capitalisation */
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [80, 'Display name too long'],
    },

    // ── Classification ────────────────────────────────────────────────────────
    category: {
      type: String,
      enum: { values: SKILL_CATEGORIES, message: '{VALUE} is not a valid category' },
      required: [true, 'Category is required'],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description too long'],
      default: '',
    },

    // ── Discovery ─────────────────────────────────────────────────────────────
    /** Alternative names / common misspellings — queried during autocomplete */
    aliases: {
      type: [{ type: String, trim: true, lowercase: true }],
      default: [],
    },
    /** Cross-references to related skills */
    relatedSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    /** Skills that supersede or are prerequisites for this one */
    parentSkill: { type: Schema.Types.ObjectId, ref: 'Skill', default: null },

    // ── Quality markers ───────────────────────────────────────────────────────
    /** Curated by the platform team vs. user-generated */
    isVerified: { type: Boolean, default: false, index: true },
    source: {
      type: String,
      enum: ['curated', 'ai_generated', 'user_added'],
      default: 'user_added',
    },

    // ── Market signal (updated periodically by a background job) ──────────────
    trend: {
      type: String,
      enum: SKILL_TREND,
      default: 'stable',
    },
    marketDemandScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    // ── Denormalized usage counter (incremented when employees add this skill) ─
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true, // used for "popular skills" queries
    },

    // ── Soft delete ───────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'skills_catalog',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound for autocomplete (category + name)
SkillCatalogSchema.index({ category: 1, name: 1 });
SkillCatalogSchema.index({ isVerified: 1, usageCount: -1 });
SkillCatalogSchema.index({ trend: 1, usageCount: -1 });

// Full-text search across names + aliases + description
SkillCatalogSchema.index(
  { name: 'text', displayName: 'text', aliases: 'text', description: 'text' },
  { weights: { name: 10, displayName: 8, aliases: 5, description: 1 }, name: 'skill_text_idx' }
);

// ─── Statics ──────────────────────────────────────────────────────────────────
SkillCatalogSchema.statics.findByNameOrAlias = function (query) {
  const q = query.toLowerCase().trim();
  return this.find({
    isActive: true,
    $or: [
      { name: q },
      { aliases: q },
      { $text: { $search: q } },
    ],
  })
    .sort({ usageCount: -1 })
    .limit(10);
};

SkillCatalogSchema.statics.autocomplete = function (prefix, limit = 8) {
  return this.find(
    { name: { $regex: `^${prefix.toLowerCase()}`, $options: 'i' }, isActive: true },
    { displayName: 1, name: 1, category: 1, usageCount: 1 }
  )
    .sort({ usageCount: -1 })
    .limit(limit);
};

SkillCatalogSchema.statics.topByCategory = function (category, limit = 10) {
  return this.find({ category, isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

/** Atomically increment usage when an employee adds this skill */
SkillCatalogSchema.statics.incrementUsage = function (skillName) {
  return this.findOneAndUpdate(
    { name: skillName.toLowerCase() },
    { $inc: { usageCount: 1 } },
    { upsert: false, new: true }
  );
};

// ─── Model ────────────────────────────────────────────────────────────────────
const Skill = mongoose.models.Skill || mongoose.model('Skill', SkillCatalogSchema);

export default Skill;
