import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { config } from '../config/env.js';

const COOKIE_NAME = 'talentgraph_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +loginAttempts +lockUntil');
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (!user.isActive) return res.status(403).json({ error: 'Account has been deactivated' });
  if (user.isLocked) return res.status(423).json({ error: 'Account temporarily locked due to too many failed attempts. Try again later.' });

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    await user.incrementLoginAttempts();
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  await user.resetLoginAttempts();
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
  await user.save();

  const tokenPayload = { id: user._id.toString(), email: user.email, name: user.name, role: user.role, avatar: user.avatar || '' };
  const token = signToken(tokenPayload);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

  return res.json({ user: tokenPayload, redirectTo: user.role === 'hr' ? '/hr' : '/employee' });
}

export async function signup(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields are required' });
  if (!['hr', 'employee'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, role, isActive: true });

  if (role === 'employee') {
    await Employee.create({ user: user._id, name: user.name, email: user.email, title: '', department: '', skills: [], approval: { status: 'draft' } });
  }

  const tokenPayload = { id: user._id.toString(), email: user.email, name: user.name, role: user.role, avatar: user.avatar || '' };
  const token = signToken(tokenPayload);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

  return res.status(201).json({ user: tokenPayload, redirectTo: role === 'hr' ? '/hr' : '/employee' });
}

export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ success: true });
}

export async function me(req, res) {
  return res.json({ user: req.user });
}
