import api from './api';

export async function buildTeam(requirement) {
  const { data } = await api.post('/api/team-builder', { requirement });
  return data;
}
