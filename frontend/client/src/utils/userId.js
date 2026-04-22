export const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return '';
  }

  const payload = token.split('.')[1];

  if (!payload) {
    return '';
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const decoded = JSON.parse(atob(paddedBase64));

    return decoded?.id ? String(decoded.id) : '';
  } catch {
    return '';
  }
};
