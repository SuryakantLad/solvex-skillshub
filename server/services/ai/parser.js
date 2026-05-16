function tryParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function repair(s) {
  return s
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g, '$1"$2":')
    .replace(/:?\s*'([^'\\]*(\\.[^'\\]*)*)'/g, (match, inner) => {
      const replaced = inner.replace(/"/g, '\\"');
      return match.startsWith(':') ? `: "${replaced}"` : `"${replaced}"`;
    });
}

export function parseJsonSafely(text) {
  if (!text) throw new SyntaxError('Empty AI response');

  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const direct = tryParse(s);
  if (direct !== null) return direct;

  const iBracket = s.indexOf('[');
  const iBrace = s.indexOf('{');
  const isArray = iBracket !== -1 && (iBrace === -1 || iBracket < iBrace);

  if (isArray) {
    const end = s.lastIndexOf(']');
    if (end > iBracket) {
      const slice = s.slice(iBracket, end + 1);
      const parsed = tryParse(slice);
      if (parsed !== null) return parsed;
      const repaired = tryParse(repair(slice));
      if (repaired !== null) return repaired;
    }
  } else if (iBrace !== -1) {
    const end = s.lastIndexOf('}');
    if (end > iBrace) {
      const slice = s.slice(iBrace, end + 1);
      const parsed = tryParse(slice);
      if (parsed !== null) return parsed;
      const repaired = tryParse(repair(slice));
      if (repaired !== null) return repaired;
    }
  }

  if (iBrace !== -1) {
    const partial = s.slice(iBrace);
    for (const closer of ['}}', '}]}', '}]}}}', '}]}}']) {
      const attempt = tryParse(repair(partial + closer));
      if (attempt !== null) return attempt;
    }
  }

  throw new SyntaxError(`Unable to parse JSON from AI response (length ${text.length}): ${text.slice(0, 200)}`);
}

export function cleanAIResponse(text) {
  try { return parseJsonSafely(text); } catch { return null; }
}
