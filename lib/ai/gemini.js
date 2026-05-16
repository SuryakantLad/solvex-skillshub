/**
 * lib/ai/gemini.js
 * Production-grade Gemini AI client for TalentGraph AI.
 *
 * Features:
 *  - Centralized model config (gemini-2.5-flash)
 *  - Separate configs for JSON extraction vs conversational tasks
 *  - Exponential backoff retry with rate-limit detection
 *  - Timeout guard (hard 55s, leaves headroom for Next.js maxDuration)
 *  - Permissive safety settings (HR content must pass)
 *  - text-embedding-004 support for semantic similarity
 *  - Structured logging (server-side only)
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// ─── Model identifiers ────────────────────────────────────────────────────────
export const MODELS = {
  flash:     'gemini-2.5-flash',
  embedding: 'text-embedding-004',
};

// ─── Generation configs ───────────────────────────────────────────────────────

/** Deterministic JSON extraction — low temperature, max tokens for full output */
export const JSON_CONFIG = {
  temperature:     0.05,
  topK:            40,
  topP:            0.95,
  maxOutputTokens: 8192,
};

/** Slightly more expressive for rankings and match reasoning */
export const RANKING_CONFIG = {
  temperature:     0.15,
  topK:            40,
  topP:            0.95,
  maxOutputTokens: 8192,
};

/** Natural conversation — higher temperature, shorter output */
export const CHAT_CONFIG = {
  temperature:     0.4,
  topK:            40,
  topP:            0.95,
  maxOutputTokens: 2048,
};

// ─── Safety settings ──────────────────────────────────────────────────────────
// Professional HR platform — we need all content to pass through
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,  threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,  threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ─── Retry constants ──────────────────────────────────────────────────────────
const BASE_BACKOFF_MS = 1200;
const HARD_TIMEOUT_MS = 55_000;

// ─── Client factory ───────────────────────────────────────────────────────────

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.');
  return new GoogleGenerativeAI(key);
}

// ─── Core generation ──────────────────────────────────────────────────────────

/**
 * Single Gemini call — no retry.
 * @param {string} prompt
 * @param {object} generationConfig
 * @returns {Promise<string>} Raw text response
 */
async function callGemini(prompt, generationConfig) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODELS.flash,
    generationConfig,
    safetySettings: SAFETY_SETTINGS,
  });

  // Hard timeout guard
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini request timed out after 55s')), HARD_TIMEOUT_MS)
  );

  const generation = model.generateContent(prompt);
  const result = await Promise.race([generation, timeout]);
  const text = result.response.text();

  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

// ─── Exported generators ─────────────────────────────────────────────────────

/**
 * Generate JSON from a prompt with retry + exponential backoff.
 * Best for: resume extraction, search ranking, team builder, skill inference.
 */
export async function generateJSON(prompt, maxRetries = 3) {
  return _withRetry(prompt, JSON_CONFIG, maxRetries);
}

/**
 * Generate ranked results (slightly warmer temperature).
 * Best for: semantic ranking, match scoring.
 */
export async function generateRanking(prompt, maxRetries = 3) {
  return _withRetry(prompt, RANKING_CONFIG, maxRetries);
}

/**
 * Generate conversational text.
 * Best for: HR chat, natural language explanations.
 */
export async function generateChat(prompt, maxRetries = 2) {
  return _withRetry(prompt, CHAT_CONFIG, maxRetries);
}

/**
 * Original generateAIResponse export — kept for backward compatibility.
 */
export async function generateAIResponse(prompt) {
  return generateJSON(prompt);
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

/**
 * Embed a text string using text-embedding-004.
 * Returns a number[] of length 768.
 */
export async function embedText(text) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODELS.embedding });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Batch embed multiple texts.
 * Useful for pre-computing candidate embeddings.
 */
export async function embedBatch(texts) {
  return Promise.all(texts.map(embedText));
}

// ─── Internal retry helper ────────────────────────────────────────────────────

async function _withRetry(prompt, config, maxRetries) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const t0 = Date.now();
    try {
      const text = await callGemini(prompt, config);
      _log('info', `Gemini OK`, { attempt, ms: Date.now() - t0, chars: text.length });
      return text;
    } catch (error) {
      lastError = error;
      const ms = Date.now() - t0;

      const isRateLimit   = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429;
      const isOverloaded  = error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.status === 503;
      const isAuth        = error.message?.includes('401') || error.message?.includes('API_KEY') || error.status === 401;
      const isTransient   = isRateLimit || isOverloaded;

      _log('warn', `Gemini attempt ${attempt}/${maxRetries} failed`, {
        error: error.message,
        ms,
        isRateLimit,
        isOverloaded,
        isAuth,
      });

      // Auth errors never retry
      if (isAuth) break;

      if (!isTransient || attempt === maxRetries) {
        // Non-transient or final attempt — bail
        if (attempt < maxRetries) continue; // non-transient still tries remaining attempts
        break;
      }

      // Exponential backoff: 1.2s → 2.4s → 4.8s; double for rate limits
      const waitMs = isRateLimit
        ? BASE_BACKOFF_MS * Math.pow(2, attempt) * 2
        : BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      await _sleep(waitMs);
    }
  }

  throw lastError;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function _sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function _log(level, message, meta = {}) {
  if (typeof window !== 'undefined') return; // never log in browser
  const entry = { level, message, ...meta, ts: new Date().toISOString() };
  if (level === 'warn' || level === 'error') {
    console.warn('[gemini]', JSON.stringify(entry));
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[gemini]', JSON.stringify(entry));
  }
}
