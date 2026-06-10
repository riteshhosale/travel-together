//change to apiFetch and add stale session handling
import { clearToken, getToken } from './auth';
import { getApiBase } from './backendBase';

const buildUrl = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBase()}${normalized}`;
};

const isFormData = (body) => typeof FormData !== 'undefined' && body instanceof FormData;

export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !isFormData(options.body) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  const message = typeof data === 'object' && data?.message ? data.message : '';
  const isStaleSession =
    response.status === 401 ||
    data?.code === 'STALE_SESSION' ||
    (response.status === 404 && /user not found/i.test(message));

  if (isStaleSession) {
    clearToken();
  }

  if (!response.ok) {
    const errorMessage = message || 'Request failed.';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    error.staleSession = isStaleSession;
    throw error;
  }

  return data;
};
