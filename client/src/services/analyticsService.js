import api from './api';

export async function getAnalytics() {
  const { data } = await api.get('/api/analytics');
  return data;
}

export async function getSkillGap(role) {
  const { data } = await api.get(`/api/analytics/skill-gap?role=${encodeURIComponent(role)}`);
  return data;
}
