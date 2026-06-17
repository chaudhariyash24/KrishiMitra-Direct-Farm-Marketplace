import axios from 'axios';

// Uses Vite proxy — no hardcoded port needed
const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('km_token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
