const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getUserIdFromRequest, isValidObjectId } = require('../utils/authUser');

describe('authUser utils', () => {
  it('reads id from jwt payload shapes', () => {
    assert.equal(getUserIdFromRequest({ user: { id: '507f1f77bcf86cd799439011' } }), '507f1f77bcf86cd799439011');
    assert.equal(getUserIdFromRequest({ user: { _id: 'abc' } }), 'abc');
  });

  it('validates object ids', () => {
    assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true);
    assert.equal(isValidObjectId('not-valid'), false);
  });
});
