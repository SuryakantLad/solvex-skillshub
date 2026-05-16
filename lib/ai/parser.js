/**
 * lib/ai/parser.js
 * Robust JSON parser for Claude AI responses.
 *
 * Handles:
 *  - Markdown code fences (```json ... ```)
 *  - Leading prose before the JSON
 *  - Trailing commas in objects/arrays
 *  - Single-quoted strings
 *  - Unquoted object keys
 *  - Truncated responses (attempts partial recovery)
 */

// ─── Internal safe-parse helper ───────────────────────────────────────────────

function tryParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

// ─── Repair heuristics ────────────────────────────────────────────────────────

function repair(s) {
  return s
    // Trailing commas: , } and , ]
    .replace(/,\s*([}\]])/g, '$1')
    // Unquoted keys: { key: → { "key":
    .replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g, '$1"$2":')
    // Single-quoted strings → double-quoted
    .replace(/:?\s*'([^'\\]*(\\.[^'\\]*)*)'/g, (match, inner) => {
      const replaced = inner.replace(/"/g, '\\"');
      return match.startsWith(':') ? `: "${replaced}"` : `"${replaced}"`;
    });
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parse JSON from a Claude AI response string.
 * Tries multiple strategies in order of cost.
 * Returns the parsed value (object or array) — never throws silently.
 * @throws {SyntaxError} if all strategies fail
 */
export function parseJsonSafely(text) {
  if (!text) throw new SyntaxError('Empty AI response');

  // 1. Strip markdown fences
  let s = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 2. Direct parse (clean response)
  const direct = tryParse(s);
  if (direct !== null) return direct;

  // 3. Locate outermost JSON structure
  const iBracket = s.indexOf('[');
  const iBrace   = s.indexOf('{');
  const isArray  = iBracket !== -1 && (iBrace === -1 || iBracket < iBrace);

  if (isArray) {
    const end = s.lastIndexOf(']');
    if (end > iBracket) {
      const slice = s.slice(iBracket, end + 1);
      const parsed  = tryParse(slice);
      if (parsed !== null) return parsed;
      const repaired = tryParse(repair(slice));
      if (repaired !== null) return repaired;
    }
  } else if (iBrace !== -1) {
    const end = s.lastIndexOf('}');
    if (end > iBrace) {
      const slice = s.slice(iBrace, end + 1);
      const parsed  = tryParse(slice);
      if (parsed !== null) return parsed;
      const repaired = tryParse(repair(slice));
      if (repaired !== null) return repaired;
    }
  }

  // 4. Truncation recovery — try adding closing brackets
  if (iBrace !== -1) {
    const partial = s.slice(iBrace);
    for (const closer of ['}}', '}]}', '}]}}}', '}]}}']) {
      const attempt = tryParse(repair(partial + closer));
      if (attempt !== null) return attempt;
    }
  }

  throw new SyntaxError(
    `Unable to parse JSON from AI response (length ${text.length}): ${text.slice(0, 200)}`
  );
}

/**
 * Backward-compatible alias — original cleanAIResponse export.
 * Returns null instead of throwing on failure.
 */
export function cleanAIResponse(text) {
  try {
    return parseJsonSafely(text);
  } catch {
    return null;
  }
}
