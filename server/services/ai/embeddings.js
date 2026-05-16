import { embedText, embedBatch } from './gemini.js';
import { cosineSimilarity } from './utils.js';

export function buildProfileText(employee) {
  const parts = [
    employee.name, employee.title, employee.department, employee.summary, employee.location,
    ...(employee.skills ?? []).filter((s) => !s.inferred).map((s) => `${s.name} ${s.proficiency} ${s.yearsOfExperience}y`),
    ...(employee.experience ?? []).slice(0, 3).map((e) => `${e.role} at ${e.company}: ${e.description ?? ''}`),
    ...(employee.certifications ?? []).map((c) => c.name),
  ];
  return parts.filter(Boolean).join(' | ');
}

export async function rankByEmbedding(query, employees) {
  const [queryEmbedding] = await Promise.all([embedText(query)]);
  const candidateTexts = employees.map(buildProfileText);
  let candidateEmbeddings;
  try {
    candidateEmbeddings = await embedBatch(candidateTexts);
  } catch {
    return employees.map((e) => ({ id: e._id?.toString(), score: 0 }));
  }
  return employees.map((emp, i) => ({
    id: emp._id?.toString(),
    score: cosineSimilarity(queryEmbedding, candidateEmbeddings[i] ?? []),
  })).sort((a, b) => b.score - a.score);
}

export async function areSkillsSimilar(skillA, skillB, threshold = 0.88) {
  const [embA, embB] = await embedBatch([skillA, skillB]);
  return cosineSimilarity(embA, embB) >= threshold;
}
