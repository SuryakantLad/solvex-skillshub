import { generateJSON } from './gemini.js';
import { buildExtractionPrompt } from './prompts.js';
import { parseJsonSafely } from './parser.js';
import { validateAndSanitize, buildEmptyResume } from './schema.js';
import { enrichWithInference } from './inference.js';
import { classifyGeminiError } from './utils.js';

export { parseJsonSafely } from './parser.js';

export function buildFallback(resumeText, errorMessage) {
  const base = buildEmptyResume();
  const emailMatch = resumeText.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) base.email = emailMatch[0].toLowerCase();
  const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) base.phone = phoneMatch[0].trim();
  const lines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 60 && /^[A-Za-z\s.'-]+$/.test(line)) { base.name = line; break; }
  }
  return { ...base, _extractionFailed: true, _fallbackReason: errorMessage, _rawTextPreview: resumeText.slice(0, 300) };
}

export async function extractResumeData(resumeText, options = {}) {
  const { maxRetries = 3, enableInference = true } = options;
  let lastError = null;
  const attemptLog = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const t0 = Date.now();
    try {
      const prompt = buildExtractionPrompt(resumeText, attempt);
      const rawText = await generateJSON(prompt, attempt > 1 ? 2 : 1);
      const parsed = parseJsonSafely(rawText);
      const { data, warnings } = validateAndSanitize(parsed);

      if (!data.name && data.skills.length === 0 && data.experience.length === 0) {
        throw new Error('Extraction produced empty result');
      }

      const enriched = enableInference ? enrichWithInference(data) : data;
      return { ...enriched, _meta: { attempt, warnings, durationMs: Date.now() - t0, model: 'gemini-2.5-flash' } };
    } catch (error) {
      lastError = error;
      attemptLog.push({ attempt, error: error.message, durationMs: Date.now() - t0 });
      const classified = classifyGeminiError(error);
      if (!classified.retryable || attempt === maxRetries) break;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }

  const fallback = buildFallback(resumeText, lastError?.message ?? 'Unknown error');
  fallback._meta = { attempt: maxRetries, attemptLog, model: 'gemini-2.5-flash' };
  return fallback;
}
