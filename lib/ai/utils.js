/**
 * lib/ai/utils.js
 * Shared utilities for the TalentGraph AI layer.
 */

// ─── Timing ───────────────────────────────────────────────────────────────────

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function stopwatch() {
  const t0 = Date.now();
  return () => Date.now() - t0;
}

// ─── Token estimation (rough 4-chars-per-token heuristic) ────────────────────

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export function truncateToTokens(text, maxTokens) {
  const maxChars = maxTokens * 4;
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

// ─── Candidate serializer for AI prompts ─────────────────────────────────────

/**
 * Slim down an Employee document to only what AI needs.
 * Keeps prompt size predictable; avoids leaking internal fields.
 */
export function serializeCandidate(emp) {
  return {
    id: emp._id?.toString() ?? emp.id,
    name: emp.name,
    title: emp.title ?? '',
    department: emp.department ?? '',
    location: emp.location ?? '',
    totalYearsExperience: emp.totalYearsExperience ?? 0,
    seniority: emp.seniority ?? '',
    available: emp.availability?.isAvailable ?? false,
    skills: (emp.skills ?? [])
      .filter((s) => !s.inferred)
      .slice(0, 20)
      .map((s) => `${s.name} (${s.proficiency}, ${s.yearsOfExperience || 0}y)`),
    certifications: (emp.certifications ?? []).slice(0, 5).map((c) => c.name),
    domainExpertise: emp.domainExpertise ?? [],
    summary: (emp.summary ?? '').slice(0, 400),
  };
}

// ─── Batch processing ─────────────────────────────────────────────────────────

/**
 * Process an array in sequential batches.
 * Used for bulk resume import to respect rate limits.
 */
export async function processBatch(items, fn, batchSize = 3, delayMs = 500) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) await sleep(delayMs);
  }
  return results;
}

// ─── Error classification ─────────────────────────────────────────────────────

export function classifyGeminiError(error) {
  const msg = error?.message ?? '';
  const status = error?.status ?? 0;

  if (status === 401 || msg.includes('API_KEY') || msg.includes('authentication')) {
    return { type: 'auth', retryable: false, userMessage: 'AI service unavailable — check your GEMINI_API_KEY.' };
  }
  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return { type: 'rate_limit', retryable: true, userMessage: 'AI rate limit reached. Please try again in a moment.' };
  }
  if (status === 503 || msg.includes('UNAVAILABLE') || msg.includes('503')) {
    return { type: 'overloaded', retryable: true, userMessage: 'AI service is temporarily overloaded. Please retry.' };
  }
  if (msg.includes('timed out')) {
    return { type: 'timeout', retryable: true, userMessage: 'AI request timed out. Please try again.' };
  }
  if (msg.includes('JSON') || msg.includes('parse')) {
    return { type: 'parse', retryable: true, userMessage: 'AI response format error. Retrying…' };
  }
  return { type: 'unknown', retryable: false, userMessage: 'AI processing failed. Please try again.' };
}

// ─── Simple in-memory LRU cache ───────────────────────────────────────────────

class LRUCache {
  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this._map = new Map();
    this._maxSize = maxSize;
    this._ttl = ttlMs;
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this._map.delete(key); return undefined; }
    // Refresh LRU order
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this._map.has(key)) this._map.delete(key);
    if (this._map.size >= this._maxSize) {
      this._map.delete(this._map.keys().next().value);
    }
    this._map.set(key, { value, expiresAt: Date.now() + this._ttl });
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  clear() {
    this._map.clear();
  }
}

// Singleton caches for hot paths
export const searchCache = new LRUCache(50,  2 * 60 * 1000);  // 2-minute TTL for search
export const teamCache   = new LRUCache(20,  5 * 60 * 1000);  // 5-minute TTL for team builder

// ─── Cosine similarity ────────────────────────────────────────────────────────

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
