const TOKEN_KEY = 'token';
export const AUTH_TOKEN_CHANGE_EVENT = 'travel-together:auth-change';

const emitAuthTokenChange = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGE_EVENT));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const isAuthenticated = () => Boolean(getToken());

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  emitAuthTokenChange();
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  emitAuthTokenChange();
};
