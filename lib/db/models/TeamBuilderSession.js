/**
 * lib/db/models/TeamBuilderSession.js
 * Persists every AI Team Builder run as a reusable session.
 *
 * Lifecycle:
 *   draft → (shared) → approved → archived
 *
 * A session holds:
 *   - The original free-text requirement
 *   - The full AI reasoning payload
 *   - A proposed team (employee refs + roles + fit scores)
 *   - Collaboration state (shared with, approvals, comments)
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

/**
 * TeamMemberSchema
 * One slot in the proposed team. Holds the AI's rationale for choosing
 * this particular employee for this particular role.
 */
const TeamMemberSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'employeeId is required'],
    },
    /** Role this person would play in the project */
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: [150, 'Role name too long'],
    },
    /** One-sentence AI explanation of this person's contribution */
    contribution: {
      type: String,
      trim: true,
      maxlength: [500, 'Contribution too long'],
    },
    /** 0–100 fit score from the AI */
    fitScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    /** HR override note (added after AI recommendation) */
    hrNote: { type: String, trim: true, default: '' },
    /** Manually swapped in by HR after initial AI output */
    isManualOverride: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * AIAnalysisSchema
 * The full structured output returned by Claude for this session.
 * Stored verbatim so the UI can re-render without a second AI call.
 */
const AIAnalysisSchema = new Schema(
  {
    teamName: { type: String, trim: true, default: '' },
    teamStrengths: [{ type: String, trim: true }],
    potentialRisks: [{ type: String, trim: true }],
    recommendation: { type: String, trim: true, default: '' },
    missingSkills: [{ type: String, trim: true }],
    generatedAt: { type: Date, default: Date.now },
    model: { type: String, default: '' },
    promptVersion: { type: String, default: '1' },
    executionTimeMs: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * CommentSchema
 * Threaded comment on a session — used for HR collaboration.
 */
const CommentSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      maxlength: [1000, 'Comment too long'],
    },
    isResolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────
const TeamBuilderSessionSchema = new Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
      index: true,
    },

    // ── Session Identity ──────────────────────────────────────────────────────
    name: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Session name too long'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description too long'],
    },

    // ── Project Requirement ───────────────────────────────────────────────────
    requirement: {
      type: String,
      required: [true, 'Project requirement is required'],
      trim: true,
      maxlength: [3000, 'Requirement too long'],
    },

    // ── AI Output ─────────────────────────────────────────────────────────────
    aiAnalysis: { type: AIAnalysisSchema, default: () => ({}) },

    // ── Proposed Team ─────────────────────────────────────────────────────────
    proposedTeam: { type: [TeamMemberSchema], default: [] },

    // ── Workflow Status ───────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['draft', 'shared', 'approved', 'rejected', 'archived'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },

    // ── Collaboration ─────────────────────────────────────────────────────────
    sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },

    // ── Approval ──────────────────────────────────────────────────────────────
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date },
    approvalNotes: { type: String, trim: true, default: '' },

    // ── Comments ──────────────────────────────────────────────────────────────
    comments: { type: [CommentSchema], default: [] },

    // ── Status audit trail ────────────────────────────────────────────────────
    statusHistory: [
      {
        fromStatus: { type: String },
        toStatus: { type: String },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
        _id: false,
      },
    ],

    // ── Tagging / Search ──────────────────────────────────────────────────────
    tags: [{ type: String, trim: true, lowercase: true }],
    projectCode: { type: String, trim: true, default: '' },

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

// ─── Indexes ──────────────────────────────────────────────────────────────────
TeamBuilderSessionSchema.index({ createdBy: 1, status: 1 });
TeamBuilderSessionSchema.index({ createdBy: 1, createdAt: -1 });
TeamBuilderSessionSchema.index({ sharedWith: 1, status: 1 });
TeamBuilderSessionSchema.index({ status: 1, updatedAt: -1 });
TeamBuilderSessionSchema.index({ tags: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
TeamBuilderSessionSchema.virtual('teamSize').get(function () {
  return this.proposedTeam?.length ?? 0;
});

TeamBuilderSessionSchema.virtual('averageFitScore').get(function () {
  if (!this.proposedTeam?.length) return 0;
  const total = this.proposedTeam.reduce((s, m) => s + (m.fitScore || 0), 0);
  return +(total / this.proposedTeam.length).toFixed(1);
});

TeamBuilderSessionSchema.virtual('openCommentsCount').get(function () {
  return this.comments?.filter((c) => !c.isResolved).length ?? 0;
});

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
TeamBuilderSessionSchema.pre('save', function (next) {
  // Auto-generate session name from requirement if not set
  if (!this.name && this.requirement) {
    this.name = this.requirement.slice(0, 60) + (this.requirement.length > 60 ? '…' : '');
  }
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Transition to a new workflow status and record the change.
 * @param {string} newStatus
 * @param {mongoose.Types.ObjectId} changedBy
 * @param {string} [note]
 */
TeamBuilderSessionSchema.methods.transitionStatus = function (newStatus, changedBy, note = '') {
  this.statusHistory.push({
    fromStatus: this.status,
    toStatus: newStatus,
    changedBy,
    changedAt: new Date(),
    note,
  });
  this.status = newStatus;
};

/** Replace a team member with a manual override */
TeamBuilderSessionSchema.methods.swapMember = function (slotId, newEmployeeId, note = '') {
  const slot = this.proposedTeam.id(slotId);
  if (!slot) return false;
  slot.employeeId = newEmployeeId;
  slot.isManualOverride = true;
  slot.hrNote = note;
  return true;
};

// ─── Statics ──────────────────────────────────────────────────────────────────

/** All sessions visible to a given user (created by or shared with) */
TeamBuilderSessionSchema.statics.visibleToUser = function (userId) {
  return this.find({
    $or: [{ createdBy: userId }, { sharedWith: userId }, { isPublic: true }],
    isDeleted: false,
  }).sort({ updatedAt: -1 });
};

/** Sessions awaiting HR approval */
TeamBuilderSessionSchema.statics.pendingApproval = function () {
  return this.find({ status: 'shared', isDeleted: false }).sort({ createdAt: 1 });
};

// ─── Model ────────────────────────────────────────────────────────────────────
const TeamBuilderSession =
  mongoose.models.TeamBuilderSession ||
  mongoose.model('TeamBuilderSession', TeamBuilderSessionSchema);

export default TeamBuilderSession;
