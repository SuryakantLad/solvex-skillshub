import api from './api';

export async function parseResume(file) {
  const formData = new FormData();
  formData.append('resume', file);
  const { data } = await api.post('/api/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
