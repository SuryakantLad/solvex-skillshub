import { getAuthToken } from './cookies';
import { verifyToken } from './jwt';

export class AuthError extends Error {
  constructor(message = 'Unauthorized', status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Read the JWT cookie and return the verified payload, or null if missing/invalid.
 * Safe to call from server components and API routes.
 * @returns {Promise<{ id: string, email: string, name: string, role: string, avatar?: string } | null>}
 */
export async function getAuthUser() {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Like getAuthUser but throws AuthError if unauthenticated or role not in allowedRoles.
 * @param {string[]} [allowedRoles]
 * @returns {Promise<{ id: string, email: string, name: string, role: string, avatar?: string }>}
 */
export async function requireAuth(allowedRoles = []) {
  const user = await getAuthUser();
  if (!user) throw new AuthError('Authentication required', 401);
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }
  return user;
}
