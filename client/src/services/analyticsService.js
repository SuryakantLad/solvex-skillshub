import api from './api';

export async function getAnalytics() {
  const { data } = await api.get('/api/analytics');

  // Transform server response to the shape the UI expects
  const skillsByCategory = {};
  for (const cat of (data.categoryBreakdown ?? [])) {
    if (cat.category) skillsByCategory[cat.category] = cat.employeeCount ?? cat.totalSkillInstances ?? 0;
  }

  const proficiencyDistribution = {};
  for (const p of (data.proficiencyDistribution ?? [])) {
    if (p._id) proficiencyDistribution[p._id] = p.count;
  }

  const seniorityDistribution = {};
  for (const s of (data.seniorityStats ?? [])) {
    if (s.band) seniorityDistribution[s.band] = s.count;
  }

  return {
    ...data,
    topSkills: data.skillFrequency?.slice(0, 20).map((s) => ({ name: s.name, count: s.count, category: s.category, avgYears: s.avgYears, expertCount: s.expertCount, advancedCount: s.advancedCount })) ?? data.topSkills ?? [],
    skillsByCategory,
    proficiencyDistribution,
    seniorityDistribution,
    departmentSkills: data.departmentSkills ?? [],
  };
}

export async function getSkillGap(role) {
  const { data } = await api.get(`/api/analytics/skill-gap?role=${encodeURIComponent(role)}`);
  return data;
}
