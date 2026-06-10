const test = require('node:test');
const assert = require('node:assert/strict');

const { validators } = require('../scripts/applyValidators');

test('validators list includes all expected collections', () => {
  const names = validators.map((item) => item.name).sort();
  assert.deepEqual(names, ['feeds', 'messages', 'reviews', 'trips', 'users']);
});

test('reviews validator enforces rating range', () => {
  const reviews = validators.find((item) => item.name === 'reviews');
  const ratingRule = reviews.validator.$jsonSchema.properties.rating;

  assert.equal(ratingRule.minimum, 1);
  assert.equal(ratingRule.maximum, 5);
});

test('trips validator requires destination and members', () => {
  const trips = validators.find((item) => item.name === 'trips');
  const required = trips.validator.$jsonSchema.required;

  assert.ok(required.includes('destination'));
  assert.ok(required.includes('members'));
});
