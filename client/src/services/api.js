import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const onAuthPage = ['/login', '/signup'].includes(window.location.pathname);
    // Don't redirect on the initial auth-check or if already on an auth page
    if (status === 401 && !url.includes('/api/auth/me') && !onAuthPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
