import api from './api';

export async function getDepartments() {
  const { data } = await api.get('/api/search/departments');
  return data;
}

export async function semanticSearch(query, filters = {}) {
  const { data } = await api.post('/api/search', { query, ...filters });
  return data;
}

export async function chatSearch(message, history = []) {
  const { data } = await api.post('/api/search/chat', { message, history });
  return data;
}
