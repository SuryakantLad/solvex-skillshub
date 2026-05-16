/**
 * lib/ai/search.js
 * Claude AI-powered semantic search engine for TalentGraph AI.
 *
 * Architecture:
 *  1. MongoDB pre-filter (hard constraints: department, experience range, availability)
 *  2. Claude semantic ranking with match reasoning
 *  3. Results enriched with full employee data
 */

import { generateRanking } from './gemini.js';
import { parseJsonSafely } from './parser.js';
import { buildSearchPrompt, buildTeamPrompt } from './prompts.js';
import { serializeCandidate, searchCache, teamCache } from './utils.js';

// ─── Semantic search ──────────────────────────────────────────────────────────

/**
 * Rank a list of employee documents against a natural language query using Claude AI.
 *
 * @param {string} query
 * @param {Array} employees  - Pre-filtered Employee documents
 * @returns {Promise<Array>} - Sorted results with matchScore, reasoning, etc.
 */
export async function semanticSearchEmployees(query, employees) {
  const cacheKey = `search:${query.toLowerCase().trim()}:${employees.map((e) => e._id).join(',')}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const candidates = employees.map(serializeCandidate);
  const prompt = buildSearchPrompt(query, candidates);

  const rawText = await generateRanking(prompt);
  const results = parseJsonSafely(rawText);

  if (!Array.isArray(results)) {
    throw new Error('Claude AI did not return a valid array for search results');
  }

  searchCache.set(cacheKey, results);
  return results;
}

// ─── Team builder ─────────────────────────────────────────────────────────────

/**
 * Build the optimal team for a project requirement using Claude AI.
 *
 * @param {string} requirement
 * @param {Array} employees
 * @returns {Promise<object>} - Team composition
 */
export async function buildOptimalTeam(requirement, employees, constraints = {}) {
  const cacheKey = `team:${requirement.toLowerCase().trim()}:${employees.length}:${JSON.stringify(constraints)}`;
  const cached = teamCache.get(cacheKey);
  if (cached) return cached;

  const candidates = employees.map(serializeCandidate);
  const prompt = buildTeamPrompt(requirement, candidates, constraints);

  const rawText = await generateRanking(prompt, 3);
  const team = parseJsonSafely(rawText);

  if (!team || typeof team !== 'object' || !Array.isArray(team.members)) {
    throw new Error('Claude AI did not return a valid team object');
  }

  teamCache.set(cacheKey, team);
  return team;
}

// ─── Quick keyword pre-score (used in chat search to avoid extra Claude AI call) ─

/**
 * Score employees by keyword overlap with a query.
 * Fast, no AI call — used as fallback/supplement.
 */
export function keywordScore(query, employees) {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  return employees
    .map((emp) => {
      const text = [
        emp.name, emp.title, emp.department, emp.summary,
        ...(emp.skills ?? []).map((s) => s.name),
        ...(emp.experience ?? []).map((e) => e.role),
      ].join(' ').toLowerCase();

      let score = words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
      // Skill matches carry extra weight
      score += (emp.skills ?? []).filter((s) =>
        words.some((w) => s.name.toLowerCase().includes(w))
      ).length * 2;

      return { ...emp, _keywordScore: score };
    })
    .sort((a, b) => b._keywordScore - a._keywordScore);
}
