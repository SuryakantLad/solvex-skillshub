import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

// ─── Schema ───────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      maxlength: [254, 'Email cannot exceed 254 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries unless explicitly requested
    },

    // ── Role & Status ─────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ['hr', 'employee', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'employee',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    avatar: {
      type: String,
      default: '',
      trim: true,
    },

    // ── Security: brute-force protection ─────────────────────────────────────
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },

    // ── Session tracking ──────────────────────────────────────────────────────
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: '',
      select: false,
    },

    // ── Onboarding ────────────────────────────────────────────────────────────
    onboardingComplete: {
      type: Boolean,
      default: false,
    },

    // ── Preferences ───────────────────────────────────────────────────────────
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      searchResultsPerPage: { type: Number, default: 20, min: 5, max: 50 },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },

    // ── Password reset ────────────────────────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-save Hooks ───────────────────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Increment failed login counter. Locks account after MAX_LOGIN_ATTEMPTS.
 * Returns the reason the lock was set, or null if no lock occurred.
 */
UserSchema.methods.incrementLoginAttempts = async function () {
  // If previous lock has expired, restart the counter
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account when threshold is reached for the first time
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }

  return this.updateOne(updates);
};

/** Clear login attempts on successful auth */
UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLoginAt: new Date() },
    $unset: { lockUntil: 1 },
  });
};

/** Return object safe to expose to client — strips all sensitive fields */
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.lastLoginIp;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

// ─── Static Methods ───────────────────────────────────────────────────────────
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

UserSchema.statics.findActiveByRole = function (role) {
  return this.find({ role, isActive: true }).sort({ createdAt: -1 });
};

// ─── Model ────────────────────────────────────────────────────────────────────
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
