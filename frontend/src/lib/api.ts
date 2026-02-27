import axios from 'axios';
import useStore from '../store';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
