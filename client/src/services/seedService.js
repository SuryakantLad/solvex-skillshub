import api from './api';

export async function getSeedStatus() {
  const { data } = await api.get('/api/seed/status');
  return data;
}

export async function seedDatabase(clear = false) {
  const { data } = await api.post('/api/seed', { clear });
  return data;
}
