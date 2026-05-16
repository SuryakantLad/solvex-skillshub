/**
 * lib/claude.js  →  now powered by Gemini 2.5 Flash
 *
 * This module retains its original export surface (parseResumeWithAI,
 * semanticSearchEmployees, buildOptimalTeam) so existing API routes
 * continue to work without changes. All AI calls now go through Gemini.
 */

export { extractResumeData as parseResumeWithAI } from './ai/extractor.js';
export { semanticSearchEmployees, buildOptimalTeam } from './ai/search.js';
