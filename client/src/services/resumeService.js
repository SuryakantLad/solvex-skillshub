import api from './api';

export async function parseResume(file) {
  const formData = new FormData();
  formData.append('resume', file);
  const { data } = await api.post('/api/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  // Server returns { success, data: parsedResume, metadata }
  return { resumeData: data.data, metadata: data.metadata };
}

export async function applyResumeDirect(payload) {
  const { data } = await api.post('/api/resume/apply', payload);
  return data;
}

export async function submitResumeForReview(payload) {
  const { data } = await api.post('/api/resume/submit', payload);
  return data;
}

export async function getResumeReviews() {
  const { data } = await api.get('/api/resume/reviews');
  return data;
}

export async function approveReview(id, notes = '') {
  const { data } = await api.post(`/api/resume/reviews/${id}/approve`, { notes });
  return data;
}

export async function rejectReview(id, notes = '') {
  const { data } = await api.post(`/api/resume/reviews/${id}/reject`, { notes });
  return data;
}

export async function editApproveReview(id, payload) {
  const { data } = await api.put(`/api/resume/reviews/${id}`, payload);
  return data;
}

export async function bulkImport(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('resumes', file));
  const { data } = await api.post('/api/resume/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
