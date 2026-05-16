/**
 * lib/claude.js  →  powered by Claude AI
 *
 * This module retains its original export surface (parseResumeWithAI,
 * semanticSearchEmployees, buildOptimalTeam) so existing API routes
 * continue to work without changes. All AI calls go through Claude.
 */

export { extractResumeData as parseResumeWithAI } from './ai/extractor.js';
export { semanticSearchEmployees, buildOptimalTeam } from './ai/search.js';
