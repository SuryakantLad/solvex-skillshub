/**
 * lib/db/models/SearchHistory.js
 * Audit trail for every AI-powered talent search performed by HR users.
 *
 * Purposes:
 *   1. Analytics — most-searched terms, popular filters, zero-result queries
 *   2. Saved searches — HR can bookmark a query and re-run it later
 *   3. Candidate engagement — track which profiles were clicked after a search
 *   4. Compliance / GDPR — know who searched for whom
 *
 * Schema is append-only by convention. Soft-delete via `isDeleted`.
 * A TTL index on `createdAt` auto-purges unsaved searches after 90 days.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Filter sub-document (mirrors the HR search UI controls) ─────────────────
const SearchFiltersSchema = new Schema(
  {
    department: { type: String, trim: true, default: '' },
    skills: [{ type: String, trim: true }],
    availability: { type: Boolean, default: null },
    experienceMin: { type: Number, min: 0, default: null },
    experienceMax: { type: Number, min: 0, default: null },
    workType: { type: String, default: '' },
    location: { type: String, trim: true, default: '' },
    approvalStatus: { type: String, default: '' },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────
const SearchHistorySchema = new Schema(
  {
    // ── Who searched ──────────────────────────────────────────────────────────
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },

    // ── Session grouping ──────────────────────────────────────────────────────
    /** Browser / tab session ID — groups multiple searches in one HR session */
    sessionId: {
      type: String,
      default: '',
      index: true,
    },

    // ── What was searched ─────────────────────────────────────────────────────
    /** Natural language query string as typed by the HR user */
    query: {
      type: String,
      required: [true, 'Query is required'],
      trim: true,
      maxlength: [1000, 'Query too long'],
    },
    /** Structured filters applied alongside the query */
    filters: { type: SearchFiltersSchema, default: () => ({}) },

    // ── Results ───────────────────────────────────────────────────────────────
    resultCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Top-3 result IDs for quick reference / analytics */
    topResultIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],

    // ── Engagement ────────────────────────────────────────────────────────────
    /** Which employee profiles the HR user clicked after this search */
    clickedProfileIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],

    // ── Performance ───────────────────────────────────────────────────────────
    executionTimeMs: { type: Number, min: 0, default: 0 },
    aiModel: { type: String, default: '' },

    // ── Saved search ──────────────────────────────────────────────────────────
    isSaved: { type: Boolean, default: false, index: true },
    savedName: {
      type: String,
      trim: true,
      maxlength: [100, 'Saved search name too long'],
      default: '',
    },
    /** Cron-like interval for scheduled re-runs: e.g. "0 9 * * 1" = Mon 9 AM */
    scheduleExpression: { type: String, default: '' },
    lastRunAt: { type: Date },

    // ── Tags ──────────────────────────────────────────────────────────────────
    tags: [{ type: String, trim: true, lowercase: true }],

    // ── Soft delete ───────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Most common query: all searches by this HR user, recent first
SearchHistorySchema.index({ userId: 1, createdAt: -1 });

// Saved searches panel
SearchHistorySchema.index({ userId: 1, isSaved: 1 });

// Analytics: top queries across all users
SearchHistorySchema.index({ createdAt: -1, resultCount: -1 });

// TTL — auto-purge non-saved searches older than 90 days
SearchHistorySchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    partialFilterExpression: { isSaved: false },
    name: 'ttl_unsaved_searches',
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
SearchHistorySchema.virtual('clickThroughRate').get(function () {
  if (!this.resultCount || this.resultCount === 0) return 0;
  return +((this.clickedProfileIds.length / this.resultCount) * 100).toFixed(1);
});

SearchHistorySchema.virtual('isZeroResult').get(function () {
  return this.resultCount === 0;
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/** Record that the HR user clicked a profile from this search */
SearchHistorySchema.methods.recordClick = function (employeeId) {
  const id = employeeId.toString();
  const alreadyClicked = this.clickedProfileIds.some((e) => e.toString() === id);
  if (!alreadyClicked) {
    this.clickedProfileIds.push(employeeId);
  }
  return this.save();
};

/** Save this search with a human-readable name for future re-use */
SearchHistorySchema.methods.saveSearch = function (name) {
  this.isSaved = true;
  this.savedName = name.trim();
  return this.save();
};

// ─── Statics ──────────────────────────────────────────────────────────────────

/** Last N searches by a specific user, excluding deleted */
SearchHistorySchema.statics.recentByUser = function (userId, limit = 20) {
  return this.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-clickedProfileIds -topResultIds');
};

/** All saved searches for a user */
SearchHistorySchema.statics.savedByUser = function (userId) {
  return this.find({ userId, isSaved: true, isDeleted: false }).sort({ savedName: 1 });
};

/** Zero-result queries in the last N days — useful for skills-gap analysis */
SearchHistorySchema.statics.zeroResultQueries = function (days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({ resultCount: 0, createdAt: { $gte: since }, isDeleted: false })
    .sort({ createdAt: -1 })
    .select('query userId createdAt');
};

/** Top N most-searched queries in the last N days */
SearchHistorySchema.statics.topQueries = function (days = 30, limit = 10) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { createdAt: { $gte: since }, isDeleted: false } },
    { $group: { _id: '$query', count: { $sum: 1 }, avgResults: { $avg: '$resultCount' } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
};

// ─── Model ────────────────────────────────────────────────────────────────────
const SearchHistory =
  mongoose.models.SearchHistory ||
  mongoose.model('SearchHistory', SearchHistorySchema);

export default SearchHistory;
