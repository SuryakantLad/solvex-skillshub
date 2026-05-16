import mongoose from 'mongoose';

const { Schema } = mongoose;

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: {
      type: String, trim: true,
      enum: ['Frontend', 'Backend', 'Database', 'Cloud', 'DevOps', 'Mobile', 'AI/ML', 'Design', 'Management', 'Security', 'Data', 'QA', 'Blockchain', 'Other'],
      default: 'Other',
    },
    proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
    yearsOfExperience: { type: Number, default: 0, min: 0, max: 50 },
    isInferred: { type: Boolean, default: false },
    source: { type: String, enum: ['manual', 'resume_parse', 'ai_inferred', 'endorsement'], default: 'manual' },
    confidence: { type: Number, min: 0, max: 100, default: 100 },
    endorsed: { type: Boolean, default: false },
    endorsedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastUsed: { type: Date },
  },
  { _id: true }
);

const InferredSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Other' },
    confidence: { type: Number, min: 0, max: 100, default: 80 },
    source: { type: String, enum: ['resume_parse', 'ai_inferred', 'linkedin_import'], default: 'resume_parse' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
    reviewedAt: { type: Date },
  },
  { _id: true }
);

const ExperienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'volunteer'], default: 'full_time' },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    location: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, maxlength: 2000 },
    achievements: [{ type: String, trim: true, maxlength: 300 }],
    technologies: [{ type: String, trim: true }],
    teamSize: { type: Number, min: 0 },
    durationMonths: { type: Number },
  },
  { _id: true }
);

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000 },
    role: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'completed', 'archived', 'on_hold'], default: 'completed' },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    technologies: [{ type: String, trim: true }],
    teamSize: { type: Number, min: 0 },
    impact: { type: String, trim: true, maxlength: 500 },
    url: { type: String, trim: true, default: '' },
    repoUrl: { type: String, trim: true, default: '' },
    highlights: [{ type: String, trim: true }],
  },
  { _id: true }
);

const CertificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    issuer: { type: String, trim: true, default: '' },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    isVerified: { type: Boolean, default: false },
  },
  { _id: true }
);

const EducationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true, maxlength: 150 },
    degree: { type: String, trim: true, default: '' },
    field: { type: String, trim: true, default: '' },
    startYear: { type: Number, min: 1950, max: 2100 },
    endYear: { type: Number, min: 1950, max: 2100 },
    grade: { type: String, trim: true, default: '' },
    honors: { type: String, trim: true, default: '' },
    activities: [{ type: String, trim: true }],
  },
  { _id: true }
);

const AvailabilitySchema = new Schema(
  {
    isAvailable: { type: Boolean, default: true },
    availableFrom: { type: Date },
    noticePeriodDays: { type: Number, default: 30, min: 0 },
    preferredWorkType: { type: String, enum: ['full_time', 'part_time', 'contract', 'freelance', 'any'], default: 'full_time' },
    openTo: { type: [String], enum: ['new_role', 'promotion', 'lateral_transfer', 'freelance', 'advisory'], default: ['new_role'] },
    preferredRoles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    remotePreference: { type: String, enum: ['remote_only', 'hybrid', 'onsite', 'flexible'], default: 'flexible' },
    hoursPerWeek: { type: Number, min: 1, max: 80 },
    salaryExpectation: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIMetadataSchema = new Schema(
  {
    resumeRawText: { type: String, select: false },
    resumeHash: { type: String, select: false, default: '' },
    lastParsedAt: { type: Date },
    parseModel: { type: String, default: '' },
    parseVersion: { type: String, default: '1' },
    overallConfidence: { type: Number, min: 0, max: 100 },
    aiSummary: { type: String, default: '' },
    parseHistory: [{ parsedAt: { type: Date, required: true }, model: { type: String }, confidence: { type: Number }, skillsExtracted: { type: Number }, _id: false }],
    aiTags: [{ type: String, trim: true }],
  },
  { _id: false }
);

const ProfileApprovalSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'pending_review', 'approved', 'rejected', 'needs_revision'], default: 'draft', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true, default: '' },
    autoApproved: { type: Boolean, default: false },
    submittedAt: { type: Date },
    revisionHistory: [{ changedAt: { type: Date }, changedBy: { type: Schema.Types.ObjectId, ref: 'User' }, fromStatus: { type: String }, toStatus: { type: String }, note: { type: String }, _id: false }],
  },
  { _id: false }
);

const GitHubDataSchema = new Schema(
  {
    username: { type: String, trim: true, default: '' },
    syncedAt: { type: Date },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    languages: [{ name: { type: String }, bytes: { type: Number }, _id: false }],
    topRepos: [{ name: { type: String }, description: { type: String, default: '' }, stars: { type: Number, default: 0 }, forks: { type: Number, default: 0 }, language: { type: String, default: '' }, url: { type: String, default: '' }, updatedAt: { type: Date }, _id: false }],
    detectedSkills: [{ type: String, trim: true }],
  },
  { _id: false }
);

const AnalyticsSchema = new Schema(
  {
    profileViews: { type: Number, default: 0, min: 0 },
    searchAppearances: { type: Number, default: 0, min: 0 },
    lastViewedAt: { type: Date },
    lastSearchedAt: { type: Date },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EmployeeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    avatar: { type: String, trim: true, default: '' },
    linkedIn: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    timezone: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '', index: true },
    department: { type: String, trim: true, default: '', index: true },
    team: { type: String, trim: true, default: '' },
    employeeId: { type: String, trim: true, default: '', sparse: true },
    managerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['active', 'inactive', 'on_leave', 'contractor', 'alumni'], default: 'active', index: true },
    workType: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'], default: 'full_time' },
    startDate: { type: Date },
    endDate: { type: Date },
    summary: { type: String, trim: true, default: '', maxlength: 2000 },
    skills: { type: [SkillSchema], default: [] },
    inferredSkills: { type: [InferredSkillSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    totalYearsExperience: { type: Number, default: 0, min: 0 },
    availability: { type: AvailabilitySchema, default: () => ({}) },
    aiMetadata: { type: AIMetadataSchema, default: () => ({}) },
    approval: { type: ProfileApprovalSchema, default: () => ({}) },
    githubData: { type: GitHubDataSchema, default: () => ({}) },
    analytics: { type: AnalyticsSchema, default: () => ({}) },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    tags: [{ type: String, trim: true, lowercase: true }],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

EmployeeSchema.index({ department: 1, status: 1 });
EmployeeSchema.index({ title: 1, status: 1 });
EmployeeSchema.index({ 'approval.status': 1, status: 1 });
EmployeeSchema.index({ 'skills.name': 1 });
EmployeeSchema.index({ updatedAt: -1 });
EmployeeSchema.index(
  { name: 'text', title: 'text', summary: 'text', 'skills.name': 'text', tags: 'text' },
  { weights: { name: 5, title: 4, 'skills.name': 3, summary: 2, tags: 1 }, name: 'employee_text_search' }
);

EmployeeSchema.virtual('pendingInferredSkillsCount').get(function () {
  return this.inferredSkills.filter((s) => s.status === 'pending').length;
});

EmployeeSchema.pre('save', function (next) {
  this.experience.forEach((exp) => {
    if (exp.startDate) {
      const end = exp.current ? new Date() : exp.endDate ?? new Date();
      const start = new Date(exp.startDate);
      exp.durationMonths = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    }
  });
  this.profileCompleteness = _calcCompleteness(this);
  next();
});

EmployeeSchema.methods.acceptInferredSkill = function (inferredSkillId) {
  const inferred = this.inferredSkills.id(inferredSkillId);
  if (!inferred || inferred.status !== 'pending') return false;
  inferred.status = 'accepted';
  inferred.reviewedAt = new Date();
  const alreadyExists = this.skills.some((s) => s.name.toLowerCase() === inferred.name.toLowerCase());
  if (!alreadyExists) {
    this.skills.push({ name: inferred.name, category: inferred.category, proficiency: 'intermediate', confidence: inferred.confidence, isInferred: true, source: inferred.source });
  }
  return true;
};

EmployeeSchema.methods.rejectInferredSkill = function (inferredSkillId) {
  const inferred = this.inferredSkills.id(inferredSkillId);
  if (!inferred || inferred.status !== 'pending') return false;
  inferred.status = 'rejected';
  inferred.reviewedAt = new Date();
  return true;
};

EmployeeSchema.methods.recordParse = function (meta) {
  if (!this.aiMetadata) this.aiMetadata = {};
  this.aiMetadata.lastParsedAt = new Date();
  this.aiMetadata.parseModel = meta.model ?? '';
  this.aiMetadata.overallConfidence = meta.confidence ?? 0;
  this.aiMetadata.parseHistory = this.aiMetadata.parseHistory || [];
  this.aiMetadata.parseHistory.push({ parsedAt: new Date(), model: meta.model, confidence: meta.confidence, skillsExtracted: meta.skillsExtracted ?? 0 });
  if (this.aiMetadata.parseHistory.length > 10) this.aiMetadata.parseHistory = this.aiMetadata.parseHistory.slice(-10);
};

EmployeeSchema.statics.textSearch = function (query, limit = 20) {
  return this.find(
    { $text: { $search: query }, isDeleted: false, status: 'active' },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } }).limit(limit);
};

function _calcCompleteness(doc) {
  let score = 0;
  if (doc.name) score += 10;
  if (doc.title) score += 10;
  if (doc.department) score += 5;
  if (doc.summary?.length > 50) score += 15;
  if (doc.skills?.length > 0) score += 20;
  if (doc.experience?.length > 0) score += 15;
  if (doc.education?.length > 0) score += 10;
  if (doc.certifications?.length > 0) score += 5;
  if (doc.avatar) score += 5;
  if (doc.linkedIn || doc.github) score += 5;
  return Math.min(100, score);
}

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export default Employee;
