// Server-only — never import this from client components.
// Use lib/resume/utils.js for client-safe helpers.

export async function extractTextFromPDF(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const cleaned = cleanText(data.text);
  return {
    text: cleaned,
    rawText: data.text,
    pages: data.numpages,
    wordCount: cleaned.split(/\s+/).filter(Boolean).length,
    charCount: cleaned.length,
  };
}

function cleanText(raw) {
  return raw
    // ── Line endings ──────────────────────────────────────────────────────────
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // ── Unicode ligatures (Type 1 / OpenType PDF fonts produce these) ────────
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    .replace(/ﬅ/g, 'ft')
    .replace(/ﬆ/g, 'st')

    // ── Typographic punctuation → ASCII equivalents ───────────────────────────
    .replace(/[‘’ʼ′]/g, "'")   // curly/prime single quotes
    .replace(/[“”″]/g, '"')           // curly double quotes
    .replace(/–/g, '-')                         // en dash
    .replace(/[—―]/g, ' - ')              // em dash / horizontal bar
    .replace(/…/g, '...')                       // ellipsis
    .replace(/[•●◦‣⁃]/g, '•') // various bullet types
    .replace(/·/g, '·')                        // middle dot
    .replace(/ /g, ' ')                        // non-breaking space

    // ── PDF word-wrap artifacts: "develop-\nment" → "development" ────────────
    .replace(/-\n([a-z])/g, '$1')

    // ── Page break character → section separator ─────────────────────────────
    .replace(/\f/g, '\n\n')

    // ── Common page footer/header noise ──────────────────────────────────────
    .replace(/^\s*Page\s+\d+\s+of\s+\d+\s*$/gim, '')
    .replace(/^\s*\d+\s*\|\s*/gm, '')   // "1 |" style page numbers
    .replace(/^\s*-\s*\d+\s*-\s*$/gm, '') // " - 1 - " page numbers

    // ── Standalone lone numbers on a line (usually page numbers) ─────────────
    .replace(/^[ \t]*\d{1,3}[ \t]*$/gm, '')

    // ── Normalize whitespace ─────────────────────────────────────────────────
    .replace(/[ \t]{2,}/g, ' ')          // multiple spaces/tabs → single space
    .replace(/\n{3,}/g, '\n\n')          // 3+ blank lines → 2

    .trim();
}
