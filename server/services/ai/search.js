import { generateRanking } from './gemini.js';
import { parseJsonSafely } from './parser.js';
import { buildSearchPrompt, buildTeamPrompt } from './prompts.js';
import { serializeCandidate, searchCache, teamCache } from './utils.js';

export async function semanticSearchEmployees(query, employees) {
  const cacheKey = `search:${query.toLowerCase().trim()}:${employees.map((e) => e._id).join(',')}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  // Use numeric indices to avoid LLM ID hallucination
  const indexToId = {};
  const candidates = employees.map((emp, idx) => {
    const key = String(idx);
    indexToId[key] = emp._id.toString();
    return { ...serializeCandidate(emp), id: key };
  });

  const prompt = buildSearchPrompt(query, candidates);
  const rawText = await generateRanking(prompt);
  const rawResults = parseJsonSafely(rawText);

  if (!Array.isArray(rawResults)) {
    throw new Error('Gemini did not return a valid array for search results');
  }

  // Remap numeric keys back to real MongoDB ObjectIds
  const results = rawResults
    .map((r) => ({ ...r, id: indexToId[String(r.id)] ?? null }))
    .filter((r) => r.id !== null);

  searchCache.set(cacheKey, results);
  return results;
}

export async function buildOptimalTeam(requirement, employees, constraints = {}) {
  const cacheKey = `team:${requirement.toLowerCase().trim()}:${employees.length}:${JSON.stringify(constraints)}`;
  const cached = teamCache.get(cacheKey);
  if (cached) return cached;

  // Use numeric indices to avoid LLM ID hallucination
  const indexToId = {};
  const candidates = employees.map((emp, idx) => {
    const key = String(idx);
    indexToId[key] = emp._id.toString();
    return { ...serializeCandidate(emp), id: key };
  });

  const prompt = buildTeamPrompt(requirement, candidates, constraints);
  const rawText = await generateRanking(prompt, 3);
  const team = parseJsonSafely(rawText);

  if (!team || typeof team !== 'object' || !Array.isArray(team.members)) {
    throw new Error('Gemini did not return a valid team object');
  }

  // Remap member ids
  team.members = (team.members ?? []).map((m) => ({ ...m, id: indexToId[String(m.id)] ?? m.id }));

  // Remap alternativeCandidates
  team.alternativeCandidates = (team.alternativeCandidates ?? []).map((a) => ({
    ...a,
    id: indexToId[String(a.id)] ?? a.id,
    alternativeFor: indexToId[String(a.alternativeFor)] ?? a.alternativeFor,
  }));

  // Remap skillCoverage coveredBy
  team.skillCoverage = (team.skillCoverage ?? []).map((sc) => ({
    ...sc,
    coveredBy: (sc.coveredBy ?? []).map((cid) => indexToId[String(cid)] ?? cid),
  }));

  teamCache.set(cacheKey, team);
  return team;
}

export function keywordScore(query, employees) {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return employees.map((emp) => {
    const text = [emp.name, emp.title, emp.department, emp.summary, ...(emp.skills ?? []).map((s) => s.name), ...(emp.experience ?? []).map((e) => e.role)].join(' ').toLowerCase();
    let score = words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
    score += (emp.skills ?? []).filter((s) => words.some((w) => s.name.toLowerCase().includes(w))).length * 2;
    return { ...emp, _keywordScore: score };
  }).sort((a, b) => b._keywordScore - a._keywordScore);
}
