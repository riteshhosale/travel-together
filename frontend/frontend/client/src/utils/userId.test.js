import { getUserIdFromToken } from './userId';

const encodePayload = (payload) => {
  const json = JSON.stringify(payload);
  const base64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${base64}.signature`;
};

describe('getUserIdFromToken', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty string when no token', () => {
    expect(getUserIdFromToken()).toBe('');
  });

  it('extracts user id from jwt payload', () => {
    localStorage.setItem('token', encodePayload({ id: '507f1f77bcf86cd799439011' }));
    expect(getUserIdFromToken()).toBe('507f1f77bcf86cd799439011');
  });

  it('returns empty string for invalid token', () => {
    localStorage.setItem('token', 'not-a-jwt');
    expect(getUserIdFromToken()).toBe('');
  });
});
