import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const COOKIE_NAME = 'talentgraph_token';

function extractToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

export function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = { id: payload.id, email: payload.email, name: payload.name, role: payload.role, avatar: payload.avatar || '' };
  next();
}

export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = { id: payload.id, email: payload.email, name: payload.name, role: payload.role, avatar: payload.avatar || '' };
  }
  next();
}

export function requireHR(req, res, next) {
  if (req.user?.role !== 'hr') return res.status(403).json({ error: 'HR access required' });
  next();
}

export function requireEmployee(req, res, next) {
  if (req.user?.role !== 'employee') return res.status(403).json({ error: 'Employee access required' });
  next();
}
