import mongoose from 'mongoose';

const { Schema } = mongoose;

export const SKILL_CATEGORIES = [
  'Frontend', 'Backend', 'Database', 'Cloud', 'DevOps',
  'Mobile', 'AI/ML', 'Design', 'Management', 'Security',
  'Data', 'QA', 'Blockchain', 'Other',
];

const SkillCatalogSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]+$/ },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: SKILL_CATEGORIES, required: true, index: true },
    subcategory: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    aliases: { type: [{ type: String, trim: true, lowercase: true }], default: [] },
    relatedSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    parentSkill: { type: Schema.Types.ObjectId, ref: 'Skill', default: null },
    isVerified: { type: Boolean, default: false, index: true },
    source: { type: String, enum: ['curated', 'ai_generated', 'user_added'], default: 'user_added' },
    trend: { type: String, enum: ['growing', 'stable', 'declining', 'emerging'], default: 'stable' },
    marketDemandScore: { type: Number, min: 0, max: 100, default: 50 },
    usageCount: { type: Number, default: 0, min: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'skills_catalog', toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SkillCatalogSchema.index({ category: 1, name: 1 });
SkillCatalogSchema.index({ isVerified: 1, usageCount: -1 });
SkillCatalogSchema.index(
  { name: 'text', displayName: 'text', aliases: 'text', description: 'text' },
  { weights: { name: 10, displayName: 8, aliases: 5, description: 1 }, name: 'skill_text_idx' }
);

SkillCatalogSchema.statics.autocomplete = function (prefix, limit = 8) {
  return this.find(
    { name: { $regex: `^${prefix.toLowerCase()}`, $options: 'i' }, isActive: true },
    { displayName: 1, name: 1, category: 1, usageCount: 1 }
  ).sort({ usageCount: -1 }).limit(limit);
};

const Skill = mongoose.models.Skill || mongoose.model('Skill', SkillCatalogSchema);
export default Skill;
