const normalizeBase = (base) => String(base || '').replace(/\/+$/, ''); // This function removes any trailing slashes from the provided base URL to ensure consistency in URL formatting.

export const getBackendBase = () => {
  const rawBase =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://travel-together-1.onrender.com');

  return normalizeBase(rawBase);
}; // This function determines the backend base URL by checking the environment variable REACT_APP_API_URL. If it's not set, it defaults to 'http://localhost:5000' in development mode and 'https://travel-together-1.onrender.com' in production. The resulting URL is normalized to remove any trailing slashes.

export const getApiBase = () => {
  const base = getBackendBase();
  return base.endsWith('/api') ? base : `${base}/api`;
}; // This function constructs the API base URL by ensuring that it ends with '/api'. It calls getBackendBase() to get the base URL and appends '/api' if it's not already present.

export const getSocketBase = () => {
  const rawBase =
    process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || getBackendBase();
  const base = normalizeBase(rawBase);
  return base.endsWith('/api') ? base.slice(0, -4) : base;
}; // Example usage:
// const apiBase = getApiBase();
// const socketBase = getSocketBase();
// This module provides utility functions to determine the backend API and socket server base URLs based on environment variables and defaults. It ensures that the URLs are normalized by removing any trailing slashes.
