import axios from 'axios';
import { clearToken, getToken } from './auth';
import { getApiBase } from './backendBase';

const API = axios.create({
  baseURL: getApiBase(),
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || '';
    const isStaleSession =
      error?.response?.status === 401 ||
      error?.response?.data?.code === 'STALE_SESSION' ||
      (error?.response?.status === 404 && /user not found/i.test(message));

    if (isStaleSession) {
      clearToken();
    }

    return Promise.reject(error);
  }
);

export default API;
