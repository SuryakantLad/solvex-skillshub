/**
 * lib/ai/embeddings.js
 * Semantic similarity utilities using Claude AI embeddings.
 *
 * Note: Embeddings are computed on-demand. For production scale,
 * pre-compute and store candidate embeddings in MongoDB.
 */

import { embedText, embedBatch } from './gemini.js';
import { cosineSimilarity } from './utils.js';

// ─── Profile text builder ─────────────────────────────────────────────────────

/**
 * Build a rich text representation of an employee for embedding.
 * More context = better semantic matching.
 */
export function buildProfileText(employee) {
  const parts = [
    employee.name,
    employee.title,
    employee.department,
    employee.summary,
    employee.location,
    ...(employee.skills ?? []).filter((s) => !s.inferred).map((s) =>
      `${s.name} ${s.proficiency} ${s.yearsOfExperience}y`
    ),
    ...(employee.experience ?? []).slice(0, 3).map((e) =>
      `${e.role} at ${e.company}: ${e.description ?? ''}`
    ),
    ...(employee.certifications ?? []).map((c) => c.name),
    ...(employee.domainExpertise ?? []),
  ];
  return parts.filter(Boolean).join(' | ');
}

// ─── Semantic ranking via embeddings ─────────────────────────────────────────

/**
 * Rank employees by semantic similarity to a query using embeddings.
 * Falls back to 0 score if embedding fails for any candidate.
 *
 * @param {string} query
 * @param {Array} employees
 * @returns {Promise<Array<{id: string, score: number}>>} sorted descending
 */
export async function rankByEmbedding(query, employees) {
  const [queryEmbedding, candidateTexts] = await Promise.all([
    embedText(query),
    Promise.resolve(employees.map(buildProfileText)),
  ]);

  let candidateEmbeddings;
  try {
    candidateEmbeddings = await embedBatch(candidateTexts);
  } catch {
    // Fallback: all scores 0 (caller falls through to keyword scoring)
    return employees.map((e) => ({ id: e._id?.toString(), score: 0 }));
  }

  return employees
    .map((emp, i) => ({
      id: emp._id?.toString(),
      score: cosineSimilarity(queryEmbedding, candidateEmbeddings[i] ?? []),
    }))
    .sort((a, b) => b.score - a.score);
}

// ─── Similarity helpers ───────────────────────────────────────────────────────

/**
 * Check if two skill names are semantically equivalent.
 * Useful for deduplication across inferred + explicit skills.
 */
export async function areSkillsSimilar(skillA, skillB, threshold = 0.88) {
  const [embA, embB] = await embedBatch([skillA, skillB]);
  return cosineSimilarity(embA, embB) >= threshold;
}
