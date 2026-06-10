const normalizeBase = (base) => String(base || '').replace(/\/+$/, '');

export const getBackendBase = () => {
  const rawBase =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://travel-together-backend-1.onrender.com');

  return normalizeBase(rawBase);
};

export const getApiBase = () => {
  const base = getBackendBase();
  return base.endsWith('/api') ? base : `${base}/api`;
};

export const getSocketBase = () => {
  const rawBase =
    process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || getBackendBase();
  const base = normalizeBase(rawBase);
  return base.endsWith('/api') ? base.slice(0, -4) : base;
};