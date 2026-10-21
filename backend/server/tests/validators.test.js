const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMatchPreferencesSchema,
  updateTripDestinationSchema,
  createTripSchema,
  updateTripSchema,
  updateGpsSchema,
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

describe('trip date validation', () => {
  it('accepts an ISO date for trip creation', () => {
    assert.equal(
      createTripSchema.safeParse({
        destination: 'Goa',
        date: '2027-01-12',
      }).success,
      true
    );
  });

  it('rejects an invalid date before it reaches the controller', () => {
    assert.equal(
      createTripSchema.safeParse({
        destination: 'Goa',
        date: 'not-a-date',
      }).success,
      false
    );
  });

  it('rejects an invalid date in a trip update', () => {
    assert.equal(
      updateTripSchema.safeParse({ date: 'not-a-date' }).success,
      false
    );
  });
});

describe('trip destination coordinates validation', () => {
  it(
    'accepts GeoJSON destination coordinates with valid longitude and latitude',
    () => {
      const result = updateTripDestinationSchema.safeParse({
        destination: 'Goa',
        destinationCoordinates: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
        },
      });
      assert.equal(result.success, true);
    }
  );

  it('rejects out-of-range destination coordinates', () => {
    const result = updateTripDestinationSchema.safeParse({
      destinationCoordinates: {
        type: 'Point',
        coordinates: [190, 18.5204],
      },
    });
    assert.equal(result.success, false);
  });
});

describe('GPS location validation', () => {
  it('rejects non-finite coordinates', () => {
    assert.equal(
      updateGpsSchema.safeParse({ coordinates: [Infinity, 18.5] }).success,
      false
    );
  });

  it('accepts valid GeoJSON coordinate ordering', () => {
    assert.equal(
      updateGpsSchema.safeParse({ coordinates: [73.8567, 18.5204] }).success,
      true
    );
  });
});
