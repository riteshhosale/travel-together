const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  destinationScore,
  budgetScore,
  scoreTripForUser,
  scoreTravelerForUser,
  sortByScoreDesc,
} = require('../utils/matching');

describe('matching utils', () => {
  it('scores exact destination matches highest', () => {
    assert.equal(destinationScore(['Goa'], 'Goa'), 45);
    assert.equal(destinationScore(['goa'], 'Goa Beach'), 35);
    assert.equal(destinationScore(['Paris'], 'Goa'), 0);
  });

  it('scores budget within range', () => {
    assert.equal(budgetScore(1000, 5000, 3000), 25);
    assert.ok(budgetScore(1000, 5000, 8000) < 25);
  });

  it('scores trips for user with preferences', () => {
    const user = {
      location: 'Goa',
      travelPreferences: {
        preferredDestinations: ['Goa'],
        budgetMin: 1000,
        budgetMax: 10000,
      },
    };
    const trip = {
      destination: 'Goa',
      budget: 5000,
      date: new Date(Date.now() + 86400000),
      members: [],
      maxMembers: 5,
    };

    const score = scoreTripForUser(user, trip);
    assert.ok(score >= 50);
  });

  it('sorts matches by score descending', () => {
    const sorted = sortByScoreDesc([
      { matchScore: 20 },
      { matchScore: 80 },
      { matchScore: 50 },
    ]);
    assert.equal(sorted[0].matchScore, 80);
    assert.equal(sorted[2].matchScore, 20);
  });

  it('scores travelers with shared style', () => {
    const viewer = {
      location: 'Mumbai',
      travelPreferences: { travelStyle: 'adventure', preferredDestinations: ['Himachal'] },
    };
    const candidate = {
      location: 'Mumbai',
      travelPreferences: { travelStyle: 'adventure', preferredDestinations: ['Himachal'] },
    };

    assert.ok(scoreTravelerForUser(viewer, candidate) >= 20);
  });
});
