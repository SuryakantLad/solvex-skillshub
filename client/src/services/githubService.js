import api from './api';

export async function getGitHubData() {
  const { data } = await api.get('/api/github');
  return data;
}

export async function syncGitHub(githubUsername) {
  const { data } = await api.post('/api/github/sync', { githubUsername });
  return data;
}
