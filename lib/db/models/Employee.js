import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SkillSchema
 * Represents a single skill entry on an employee profile.
 * `isInferred` / `source` / `confidence` support AI-extracted skills
 * flowing through a review workflow before being fully "owned".
 */
const SkillSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: [80, 'Skill name cannot exceed 80 characters'],
    },
    category: {
      type: String,
      trim: true,
      enum: [
        'Frontend', 'Backend', 'Database', 'Cloud', 'DevOps',
        'Mobile', 'AI/ML', 'Design', 'Management', 'Security',
        'Data', 'QA', 'Blockchain', 'Other',
      ],
      default: 'Other',
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years cannot be negative'],
      max: [50, 'Years cannot exceed 50'],
    },
    // Attribution
    isInferred: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['manual', 'resume_parse', 'ai_inferred', 'endorsement'],
      default: 'manual',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 100, // 100 = user-entered, <100 = AI guess
    },
    endorsed: { type: Boolean, default: false },
    endorsedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastUsed: { type: Date },
  },
  { _id: true }
);

/**
 * InferredSkillSchema
 * Holds raw AI-suggested skills that are pending employee review.
 * Accepted → promoted to `skills[]`. Rejected → discarded.
 */
const InferredSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Other' },
    confidence: { type: Number, min: 0, max: 100, default: 80 },
    source: {
      type: String,
      enum: ['resume_parse', 'ai_inferred', 'linkedin_import'],
      default: 'resume_parse',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedAt: { type: Date },
  },
  { _id: true }
);

/**
 * ExperienceSchema
 * Work history entry with achievements and tech-stack breakdown.
 */
const ExperienceSchema = new Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [120, 'Company name too long'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: [120, 'Role too long'],
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'volunteer'],
      default: 'full_time',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    location: { type: String, trim: true, default: '' },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description too long'],
    },
    achievements: [
      {
        type: String,
        trim: true,
        maxlength: [300, 'Achievement too long'],
      },
    ],
    technologies: [{ type: String, trim: true }],
    teamSize: { type: Number, min: 0 },
    // Denormalized duration in months (calculated on save)
    durationMonths: { type: Number },
  },
  { _id: true }
);

/**
 * ProjectSchema
 * Side project or work project with impact and links.
 */
const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description too long'],
    },
    role: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'on_hold'],
      default: 'completed',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    technologies: [{ type: String, trim: true }],
    teamSize: { type: Number, min: 0 },
    impact: {
      type: String,
      trim: true,
      maxlength: [500, 'Impact description too long'],
    },
    url: { type: String, trim: true, default: '' },
    repoUrl: { type: String, trim: true, default: '' },
    highlights: [{ type: String, trim: true }],
  },
  { _id: true }
);

/**
 * CertificationSchema
 * Professional certification with optional expiry and verification.
 */
const CertificationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
      maxlength: [150, 'Certification name too long'],
    },
    issuer: { type: String, trim: true, default: '' },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { _id: true }
);

// ─── Computed virtual: isExpired ──────────────────────────────────────────────
CertificationSchema.virtual('isExpired').get(function () {
  return this.expiryDate ? this.expiryDate < new Date() : false;
});

/**
 * EducationSchema
 */
const EducationSchema = new Schema(
  {
    institution: {
      type: String,
      required: [true, 'Institution is required'],
      trim: true,
      maxlength: [150, 'Institution name too long'],
    },
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

/**
 * AvailabilitySchema
 * Captures current availability status and preferences for new roles.
 */
const AvailabilitySchema = new Schema(
  {
    isAvailable: { type: Boolean, default: true },
    availableFrom: { type: Date },
    noticePeriodDays: { type: Number, default: 30, min: 0 },
    preferredWorkType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'freelance', 'any'],
      default: 'full_time',
    },
    openTo: {
      type: [String],
      enum: ['new_role', 'promotion', 'lateral_transfer', 'freelance', 'advisory'],
      default: ['new_role'],
    },
    preferredRoles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    remotePreference: {
      type: String,
      enum: ['remote_only', 'hybrid', 'onsite', 'flexible'],
      default: 'flexible',
    },
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

/**
 * AIMetadataSchema
 * Tracks all AI-assisted operations: resume parses, summaries, confidence.
 */
const AIMetadataSchema = new Schema(
  {
    // Raw resume text — excluded from default queries for size
    resumeRawText: { type: String, select: false },
    // SHA-256 of the uploaded PDF — detect re-uploads of same file
    resumeHash: { type: String, select: false, default: '' },
    lastParsedAt: { type: Date },
    parseModel: { type: String, default: '' },    // e.g. "claude-sonnet-4-6"
    parseVersion: { type: String, default: '1' }, // increment on prompt changes
    overallConfidence: { type: Number, min: 0, max: 100 },
    // Brief AI-generated bio / professional summary
    aiSummary: { type: String, default: '' },
    // Immutable history of every parse run
    parseHistory: [
      {
        parsedAt: { type: Date, required: true },
        model: { type: String },
        confidence: { type: Number },
        skillsExtracted: { type: Number },
        _id: false,
      },
    ],
    // Tags the AI attached to this profile for faceted search
    aiTags: [{ type: String, trim: true }],
  },
  { _id: false }
);

/**
 * ProfileApprovalSchema
 * HR workflow: employee submits profile → HR reviews → approved / rejected.
 */
const ProfileApprovalSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'needs_revision'],
      default: 'draft',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true, default: '' },
    autoApproved: { type: Boolean, default: false },
    submittedAt: { type: Date },
    revisionHistory: [
      {
        changedAt: { type: Date },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        fromStatus: { type: String },
        toStatus: { type: String },
        note: { type: String },
        _id: false,
      },
    ],
  },
  { _id: false }
);

/**
 * GitHubDataSchema
 * Cached data from the public GitHub API, synced on demand.
 */
const GitHubDataSchema = new Schema(
  {
    username: { type: String, trim: true, default: '' },
    syncedAt: { type: Date },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    languages: [
      {
        name: { type: String },
        bytes: { type: Number },
        _id: false,
      },
    ],
    topRepos: [
      {
        name: { type: String },
        description: { type: String, default: '' },
        stars: { type: Number, default: 0 },
        forks: { type: Number, default: 0 },
        language: { type: String, default: '' },
        url: { type: String, default: '' },
        updatedAt: { type: Date },
        _id: false,
      },
    ],
    detectedSkills: [{ type: String, trim: true }],
  },
  { _id: false }
);

/**
 * AnalyticsSchema
 * Lightweight counters — incremented by API routes, never computed on-the-fly.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Main EmployeeSchema
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeSchema = new Schema(
  {
    // ── Relation to User ──────────────────────────────────────────────────────
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
      unique: true,
      index: true,
    },

    // ── Personal Info ─────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: '' },
    avatar: { type: String, trim: true, default: '' },

    // Social links
    linkedIn: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },

    // Location
    location: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    timezone: { type: String, trim: true, default: '' },

    // ── Role / Department ─────────────────────────────────────────────────────
    title: { type: String, trim: true, default: '', index: true },
    department: { type: String, trim: true, default: '', index: true },
    team: { type: String, trim: true, default: '' },
    // Internal employee number
    employeeId: { type: String, trim: true, default: '', sparse: true },
    managerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Employment Status ─────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'contractor', 'alumni'],
      default: 'active',
      index: true,
    },
    workType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'freelance'],
      default: 'full_time',
    },
    startDate: { type: Date },
    endDate: { type: Date },

    // ── Biography ─────────────────────────────────────────────────────────────
    summary: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Summary too long'],
    },

    // ── Skills ────────────────────────────────────────────────────────────────
    /** Verified / user-owned skills */
    skills: { type: [SkillSchema], default: [] },
    /** AI-extracted suggestions awaiting review */
    inferredSkills: { type: [InferredSkillSchema], default: [] },

    // ── Career History ────────────────────────────────────────────────────────
    experience: { type: [ExperienceSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    education: { type: [EducationSchema], default: [] },

    // ── Rolled-up stats ───────────────────────────────────────────────────────
    totalYearsExperience: { type: Number, default: 0, min: 0 },

    // ── Availability ──────────────────────────────────────────────────────────
    availability: { type: AvailabilitySchema, default: () => ({}) },

    // ── AI Metadata ───────────────────────────────────────────────────────────
    aiMetadata: { type: AIMetadataSchema, default: () => ({}) },

    // ── HR Approval Workflow ──────────────────────────────────────────────────
    approval: { type: ProfileApprovalSchema, default: () => ({}) },

    // ── GitHub Integration ────────────────────────────────────────────────────
    githubData: { type: GitHubDataSchema, default: () => ({}) },

    // ── Analytics ─────────────────────────────────────────────────────────────
    analytics: { type: AnalyticsSchema, default: () => ({}) },

    // ── Profile Quality ───────────────────────────────────────────────────────
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },

    // ── Flexible tagging ──────────────────────────────────────────────────────
    tags: [{ type: String, trim: true, lowercase: true }],

    // ── Soft delete ───────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────
// Compound — common HR filters
EmployeeSchema.index({ department: 1, status: 1 });
EmployeeSchema.index({ title: 1, status: 1 });
EmployeeSchema.index({ 'approval.status': 1, status: 1 });
EmployeeSchema.index({ 'availability.isAvailable': 1, status: 1 });

// Skills faceting
EmployeeSchema.index({ 'skills.name': 1 });
EmployeeSchema.index({ 'skills.category': 1 });
EmployeeSchema.index({ 'skills.proficiency': 1 });

// Inferred skills — only index pending ones (sparse to save space)
EmployeeSchema.index(
  { 'inferredSkills.status': 1 },
  { partialFilterExpression: { 'inferredSkills.status': 'pending' } }
);

// Text search fallback (used when AI search is unavailable)
EmployeeSchema.index(
  {
    name: 'text',
    title: 'text',
    summary: 'text',
    'skills.name': 'text',
    tags: 'text',
  },
  {
    weights: { name: 5, title: 4, 'skills.name': 3, summary: 2, tags: 1 },
    name: 'employee_text_search',
  }
);

// Sorted listing
EmployeeSchema.index({ updatedAt: -1 });
EmployeeSchema.index({ profileCompleteness: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// Virtuals
// ─────────────────────────────────────────────────────────────────────────────
EmployeeSchema.virtual('pendingInferredSkillsCount').get(function () {
  return this.inferredSkills.filter((s) => s.status === 'pending').length;
});

EmployeeSchema.virtual('activeCertificationsCount').get(function () {
  return this.certifications.filter((c) => !c.isExpired).length;
});

// ─────────────────────────────────────────────────────────────────────────────
// Pre-save Hooks
// ─────────────────────────────────────────────────────────────────────────────
EmployeeSchema.pre('save', function (next) {
  // Compute experience duration for each role
  this.experience.forEach((exp) => {
    if (exp.startDate) {
      const end = exp.current ? new Date() : exp.endDate ?? new Date();
      const start = new Date(exp.startDate);
      exp.durationMonths = Math.max(
        0,
        (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth())
      );
    }
  });

  // Recalculate profile completeness
  this.profileCompleteness = _calcCompleteness(this);

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Instance Methods
// ─────────────────────────────────────────────────────────────────────────────

/** Recalculate and persist profile completeness score */
EmployeeSchema.methods.calculateCompleteness = function () {
  this.profileCompleteness = _calcCompleteness(this);
  return this.profileCompleteness;
};

/**
 * Promote an inferred skill to the verified skills array.
 * @param {string} inferredSkillId
 */
EmployeeSchema.methods.acceptInferredSkill = function (inferredSkillId) {
  const inferred = this.inferredSkills.id(inferredSkillId);
  if (!inferred || inferred.status !== 'pending') return false;

  inferred.status = 'accepted';
  inferred.reviewedAt = new Date();

  const alreadyExists = this.skills.some(
    (s) => s.name.toLowerCase() === inferred.name.toLowerCase()
  );

  if (!alreadyExists) {
    this.skills.push({
      name: inferred.name,
      category: inferred.category,
      proficiency: 'intermediate',
      confidence: inferred.confidence,
      isInferred: true,
      source: inferred.source,
    });
  }

  return true;
};

/** Mark an inferred skill as rejected */
EmployeeSchema.methods.rejectInferredSkill = function (inferredSkillId) {
  const inferred = this.inferredSkills.id(inferredSkillId);
  if (!inferred || inferred.status !== 'pending') return false;
  inferred.status = 'rejected';
  inferred.reviewedAt = new Date();
  return true;
};

/**
 * Record a resume parse run into aiMetadata.parseHistory.
 * @param {{ model: string, confidence: number, skillsExtracted: number }} meta
 */
EmployeeSchema.methods.recordParse = function (meta) {
  if (!this.aiMetadata) this.aiMetadata = {};
  this.aiMetadata.lastParsedAt = new Date();
  this.aiMetadata.parseModel = meta.model ?? '';
  this.aiMetadata.overallConfidence = meta.confidence ?? 0;

  this.aiMetadata.parseHistory.push({
    parsedAt: new Date(),
    model: meta.model,
    confidence: meta.confidence,
    skillsExtracted: meta.skillsExtracted ?? 0,
  });

  // Keep only the last 10 parse runs
  if (this.aiMetadata.parseHistory.length > 10) {
    this.aiMetadata.parseHistory = this.aiMetadata.parseHistory.slice(-10);
  }
};

/** Increment profile view counter and update timestamp */
EmployeeSchema.methods.recordView = function () {
  if (!this.analytics) this.analytics = {};
  this.analytics.profileViews = (this.analytics.profileViews || 0) + 1;
  this.analytics.lastViewedAt = new Date();
};

// ─────────────────────────────────────────────────────────────────────────────
// Static Methods
// ─────────────────────────────────────────────────────────────────────────────

/** Employees with at least one pending inferred skill */
EmployeeSchema.statics.withPendingSkills = function () {
  return this.find({ 'inferredSkills.status': 'pending', isDeleted: false });
};

/** Full-text search fallback */
EmployeeSchema.statics.textSearch = function (query, limit = 20) {
  return this.find(
    { $text: { $search: query }, isDeleted: false, status: 'active' },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────
const Employee =
  mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

export default Employee;

// Named sub-schema exports — useful for unit tests and validation utilities
export {
  SkillSchema,
  InferredSkillSchema,
  ExperienceSchema,
  ProjectSchema,
  CertificationSchema,
  EducationSchema,
  AvailabilitySchema,
  AIMetadataSchema,
  ProfileApprovalSchema,
  AnalyticsSchema,
  GitHubDataSchema,
};
