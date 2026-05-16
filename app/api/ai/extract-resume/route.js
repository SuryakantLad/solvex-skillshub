/**
 * POST /api/ai/extract-resume
 * Full AI resume extraction pipeline using Claude AI.
 *
 * Accepts: { resumeText: string } — raw text already extracted from PDF
 * Returns: { success: true, data: parsedResume, meta: { attempt, warnings, durationMs } }
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import { generateJSON } from '@/lib/ai/gemini';
import { parseJsonSafely } from '@/lib/ai/parser';
import { buildExtractionPrompt } from '@/lib/ai/prompts';
import { validateAndSanitize, buildEmptyResume } from '@/lib/ai/schema';
import { enrichWithInference } from '@/lib/ai/inference';
import { classifyGeminiError } from '@/lib/ai/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_RETRIES = 3;

// ─── Fallback extractor (regex-based, no AI) ──────────────────────────────────

function buildFallback(resumeText, errorMsg) {
  const base = buildEmptyResume();

  const emailMatch = resumeText.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) base.email = emailMatch[0].toLowerCase();

  const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) base.phone = phoneMatch[0].trim();

  const lines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 60 && /^[A-Za-z\s.'-]+$/.test(line)) {
      base.name = line;
      break;
    }
  }

  return {
    ...base,
    _extractionFailed: true,
    _fallbackReason: errorMsg,
    _rawTextPreview: resumeText.slice(0, 300),
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request) {
  const t0 = Date.now();

  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { resumeText, enableInference = true } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json({ error: 'resumeText is required' }, { status: 400 });
    }

    if (resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Resume text is too short — minimum 100 characters required.' },
        { status: 422 }
      );
    }

    let lastError = null;
    const attemptLog = [];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const tAttempt = Date.now();
      try {
        const prompt = buildExtractionPrompt(resumeText, attempt);
        const rawText = await generateJSON(prompt, attempt === 1 ? 1 : 2);
        const parsed = parseJsonSafely(rawText);
        const { data, warnings } = validateAndSanitize(parsed);

        if (!data.name && data.skills.length === 0 && data.experience.length === 0) {
          throw new Error('Extraction produced empty result — no name, skills, or experience found');
        }

        const enriched = enableInference ? enrichWithInference(data) : data;

        return NextResponse.json({
          success: true,
          data: enriched,
          meta: {
            attempt,
            warnings,
            durationMs: Date.now() - t0,
            model: 'gemini-2.5-flash',
          },
        });
      } catch (error) {
        lastError = error;
        attemptLog.push({ attempt, error: error.message, durationMs: Date.now() - tAttempt });

        const classified = classifyGeminiError(error);
        if (!classified.retryable || attempt === MAX_RETRIES) break;

        // Short wait before retry
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }

    // All retries failed — return graceful fallback with partial extraction
    const fallback = buildFallback(resumeText, lastError?.message ?? 'Unknown error');
    return NextResponse.json({
      success: false,
      data: fallback,
      meta: {
        attempt: MAX_RETRIES,
        attemptLog,
        durationMs: Date.now() - t0,
        model: 'gemini-2.5-flash',
      },
    });
  } catch (error) {
    console.error('[extract-resume]', error);
    const { userMessage } = classifyGeminiError(error);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
