// Client-safe resume utilities — no Node.js built-ins, no pdf-parse

export function validatePDFFile(file) {
  if (!file) return { valid: false, error: 'No file provided' };
  if (file.type !== 'application/pdf' && !file.name?.endsWith('.pdf')) {
    return { valid: false, error: 'Only PDF files are supported' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File must be under 10MB' };
  }
  if (file.size < 512) {
    return { valid: false, error: 'File appears to be empty or corrupted' };
  }
  return { valid: true };
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
