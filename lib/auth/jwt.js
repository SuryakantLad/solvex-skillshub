import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret-change-me'
);

const ALGORITHM = 'HS256';
const EXPIRY = '30d';

/**
 * @param {{ id: string, email: string, name: string, role: string, avatar?: string }} payload
 * @returns {Promise<string>}
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setIssuer('talentgraph')
    .sign(SECRET);
}

/**
 * @param {string} token
 * @returns {Promise<{ id: string, email: string, name: string, role: string, avatar?: string } | null>}
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: 'talentgraph' });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Decode without verifying — for reading expired tokens on logout, etc.
 * @param {string} token
 * @returns {object | null}
 */
export function decodeToken(token) {
  try {
    const [, payloadB64] = token.split('.');
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}
