import client from './client';

export const triggerSeed = () => client.post('/admin/seed');

export const uploadCSV = (file, type) => {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  return client.post('/admin/csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
