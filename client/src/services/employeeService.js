import api from './api';

export async function listEmployees({ department, skill, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (department && department !== 'all') params.set('department', department);
  if (skill) params.set('skill', skill);
  params.set('page', page);
  params.set('limit', limit);
  const { data } = await api.get(`/api/employees?${params}`);
  return data;
}

export async function getEmployee(id) {
  const { data } = await api.get(`/api/employees/${id}`);
  return data;
}

export async function getMyProfile() {
  const { data } = await api.get('/api/employees/me/profile');
  return data;
}

export async function updateEmployee(id, payload) {
  const { data } = await api.put(`/api/employees/${id}`, payload);
  return data;
}

export async function acceptInferredSkill(id, skillId) {
  const { data } = await api.post(`/api/employees/${id}/skills/${skillId}/accept`);
  return data;
}

export async function rejectInferredSkill(id, skillId) {
  const { data } = await api.post(`/api/employees/${id}/skills/${skillId}/reject`);
  return data;
}
