const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMatchPreferencesSchema,
} = require('../validators/requestSchemas');

describe('auth validators', () => {
  it('accepts valid forgot-password email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    assert.equal(result.success, true);
  });

  it('rejects invalid forgot-password email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    assert.equal(result.success, false);
  });

  it('accepts valid reset-password payload', () => {
    const token = 'a'.repeat(64);
    const result = resetPasswordSchema.safeParse({
      token,
      newPassword: 'secret12',
    });
    assert.equal(result.success, true);
  });
});

describe('match preferences validator', () => {
  it('accepts travel style and destinations', () => {
    const result = updateMatchPreferencesSchema.safeParse({
      preferredDestinations: ['Goa', 'Manali'],
      budgetMin: 1000,
      budgetMax: 8000,
      travelStyle: 'adventure',
      bio: 'Love hiking',
    });
    assert.equal(result.success, true);
  });
});
