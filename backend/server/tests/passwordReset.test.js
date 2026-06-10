const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  generateResetToken,
  hashResetToken,
  getResetExpiryDate,
} = require('../utils/passwordReset');

describe('password reset utils', () => {
  it('generates unique tokens', () => {
    const a = generateResetToken();
    const b = generateResetToken();
    assert.notEqual(a, b);
    assert.equal(a.length, 64);
  });

  it('hashes tokens consistently', () => {
    const token = 'test-token-value';
    assert.equal(hashResetToken(token), hashResetToken(token));
    assert.notEqual(hashResetToken(token), hashResetToken('other'));
  });

  it('sets expiry in the future', () => {
    const expiry = getResetExpiryDate();
    assert.ok(expiry.getTime() > Date.now());
  });
});
