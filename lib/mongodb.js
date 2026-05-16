/**
 * lib/mongodb.js
 * Canonical MongoDB connection for TalentGraph AI.
 *
 * Features:
 *  - Connection pooling with configurable pool size
 *  - Global singleton cache (safe for Next.js hot-reload)
 *  - Connection-state events with structured logging
 *  - Automatic promise-reset on failure so the next call retries
 *  - Health-check helper
 *  - Clean disconnect for test teardown
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not defined. ' +
      'Add it to .env.local: MONGODB_URI=mongodb+srv://...'
  );
}

/** Mongoose connection options — tuned for Atlas M0/M10+ */
const CONNECTION_OPTIONS = {
  // Never buffer operations while disconnected; fail fast instead.
  bufferCommands: false,

  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 2,

  // Timeouts (ms)
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  serverSelectionTimeoutMS: 10_000,
  heartbeatFrequencyMS: 10_000,

  // Atlas recommended flags
  retryWrites: true,
  retryReads: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Singleton cache — stored on `global` so it survives Next.js HMR in dev
// ─────────────────────────────────────────────────────────────────────────────
/** @type {{ conn: mongoose.Mongoose | null, promise: Promise<mongoose.Mongoose> | null }} */
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

/** Structured logger — swapped to a real logger in production if needed */
const log = {
  info: (msg) => console.log(`[MongoDB] ${msg}`),
  warn: (msg) => console.warn(`[MongoDB] ${msg}`),
  error: (msg, err) => console.error(`[MongoDB] ${msg}`, err?.message ?? ''),
};

/** Register connection-lifecycle events exactly once */
let eventsRegistered = false;
function registerEvents() {
  if (eventsRegistered) return;
  eventsRegistered = true;

  mongoose.connection.on('connected', () =>
    log.info(`Connected — pool: ${CONNECTION_OPTIONS.maxPoolSize}`)
  );
  mongoose.connection.on('disconnected', () => {
    log.warn('Disconnected. Cache cleared.');
    cached.conn = null;
    cached.promise = null;
  });
  mongoose.connection.on('reconnected', () => log.info('Reconnected.'));
  mongoose.connection.on('error', (err) => {
    log.error('Connection error —', err);
    cached.promise = null;
  });
  mongoose.connection.on('close', () => log.info('Connection closed.'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * connectDB()
 * Returns a cached connection. Creates one on first call.
 * Safe to call from any Next.js Server Component, API Route, or Server Action.
 */
export async function connectDB() {
  // Already connected — return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  registerEvents();

  // Start connection only once even under parallel awaits
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, CONNECTION_OPTIONS)
      .then((m) => {
        log.info(`Ready — host: ${m.connection.host}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so the next request can retry
    cached.promise = null;
    log.error('Initial connection failed —', err);
    throw err;
  }

  return cached.conn;
}

/**
 * disconnectDB()
 * Cleanly close the connection. Use in test teardown.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cached.conn = null;
  cached.promise = null;
}

/**
 * getConnectionStatus()
 * Returns a human-readable connection state.
 * @returns {'disconnected'|'connected'|'connecting'|'disconnecting'|'unknown'}
 */
export function getConnectionStatus() {
  const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}

/**
 * healthCheck()
 * Pings the DB and returns latency in ms.
 * Used by /api/health route.
 */
export async function healthCheck() {
  await connectDB();
  const t0 = Date.now();
  await mongoose.connection.db.admin().ping();
  return { status: 'ok', latencyMs: Date.now() - t0 };
}

export default connectDB;
