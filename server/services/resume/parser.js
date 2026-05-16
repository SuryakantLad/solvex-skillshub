export async function extractTextFromPDF(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const cleaned = cleanText(data.text);
  return { text: cleaned, rawText: data.text, pages: data.numpages, wordCount: cleaned.split(/\s+/).filter(Boolean).length, charCount: cleaned.length };
}

function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff').replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl')
    .replace(/[''ʼ′]/g, "'").replace(/[""″]/g, '"').replace(/–/g, '-').replace(/[—―]/g, ' - ').replace(/…/g, '...')
    .replace(/[•●◦‣⁃]/g, '•').replace(/ /g, ' ')
    .replace(/-\n([a-z])/g, '$1').replace(/\f/g, '\n\n')
    .replace(/^\s*Page\s+\d+\s+of\s+\d+\s*$/gim, '').replace(/^\s*\d+\s*\|\s*/gm, '').replace(/^\s*-\s*\d+\s*-\s*$/gm, '')
    .replace(/^[ \t]*\d{1,3}[ \t]*$/gm, '').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
