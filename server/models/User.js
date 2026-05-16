import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 2 * 60 * 60 * 1000;

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'], maxlength: 254,
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    role: { type: String, enum: ['hr', 'employee', 'admin'], default: 'employee', index: true },
    isActive: { type: Boolean, default: true, index: true },
    avatar: { type: String, default: '', trim: true },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: '', select: false },
    onboardingComplete: { type: Boolean, default: false },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      searchResultsPerPage: { type: Number, default: 20, min: 5, max: 50 },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } });
};

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

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
