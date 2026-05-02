import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  res => {
    const body = res.data;
    // Backend returns plain arrays for list endpoints → normalize to { data: [...] }
    if (Array.isArray(body)) {
      return { data: body, total: body.length };
    }
    // Already normalized (e.g. { data: [...], total: N })
    if (body && Array.isArray(body.data)) {
      return body;
    }
    // Single object or other response → return as-is
    return body;
  },
  err => Promise.reject(err.response?.data ?? err)
);

export default client;
