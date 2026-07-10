const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .trim();

const parseBudget = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const destinationScore = (preferredList, targetDestination) => {
  const target = normalizeText(targetDestination);

  if (!target) {
    return 0;
  }

  let best = 0;

  for (const item of preferredList) {
    const pref = normalizeText(item);

    if (!pref) {
      continue;
    }

    if (target === pref) {
      best = Math.max(best, 45);
    } else if (target.includes(pref) || pref.includes(target)) {
      best = Math.max(best, 35);
    }
  }

  return best;
};

const budgetScore = (budgetMin, budgetMax, tripBudget) => {
  const budget = parseBudget(tripBudget);

  if (budget === null) {
    return 12;
  }

  const min = parseBudget(budgetMin);
  const max = parseBudget(budgetMax);

  if (min === null && max === null) {
    return 15;
  }

  if (min !== null && budget < min) {
    const gap = min - budget;
    return Math.max(0, 25 - Math.min(25, gap / Math.max(min, 1)));
  }

  if (max !== null && budget > max) {
    const gap = budget - max;
    return Math.max(0, 25 - Math.min(25, gap / Math.max(max, 1)));
  }

  return 25;
};

const locationScore = (userLocation, otherLocation) => {
  const a = normalizeText(userLocation);
  const b = normalizeText(otherLocation);

  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 20;
  }

  if (a.includes(b) || b.includes(a)) {
    return 12;
  }

  return 0;
};

const styleScore = (preferredStyle, otherStyle) => {
  const a = normalizeText(preferredStyle || 'any');
  const b = normalizeText(otherStyle || 'any');

  if (a === 'any' || b === 'any') {
    return 8;
  }

  return a === b ? 15 : 0;
};

const getPreferredDestinations = (user) => {
  const prefs = user.travelPreferences || {};
  const list = Array.isArray(prefs.preferredDestinations) ? prefs.preferredDestinations : [];

  if (user.location) {
    return [...list, user.location];
  }

  return list;
};

const scoreTripForUser = (user, trip) => {
  const prefs = user.travelPreferences || {};
  let score = 0;

  score += destinationScore(getPreferredDestinations(user), trip.destination);
  score += budgetScore(prefs.budgetMin, prefs.budgetMax, trip.budget);

  if (trip.date) {
    const tripDate = new Date(trip.date);
    if (!Number.isNaN(tripDate.getTime()) && tripDate.getTime() > Date.now()) {
      score += 10;
    }
  }

  const members = Array.isArray(trip.members) ? trip.members.length : 0;
  if (typeof trip.maxMembers === 'number' && members < trip.maxMembers) {
    score += 10;
  } else if (!trip.maxMembers) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
};

const scoreTravelerForUser = (viewer, candidate) => {
  const viewerPrefs = viewer.travelPreferences || {};
  const candidatePrefs = candidate.travelPreferences || {};
  let score = 0;

  const viewerDestinations = getPreferredDestinations(viewer);
  const candidateDestinations = getPreferredDestinations(candidate);

  for (const dest of viewerDestinations) {
    score += destinationScore(candidateDestinations, dest) > 0 ? 15 : 0;
  }

  score += locationScore(viewer.location, candidate.location);
  score += styleScore(viewerPrefs.travelStyle, candidatePrefs.travelStyle);
  score += budgetScore(viewerPrefs.budgetMin, viewerPrefs.budgetMax, candidatePrefs.budgetMax);

  if (candidatePrefs.bio && viewerPrefs.bio) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
};

const scoreTravelerForTrip = (trip, candidate) => {
  const prefs = candidate.travelPreferences || {};
  let score = 0;

  score += destinationScore(getPreferredDestinations(candidate), trip.destination);
  score += budgetScore(prefs.budgetMin, prefs.budgetMax, trip.budget);
  score += locationScore(candidate.location, trip.destination);

  return Math.min(100, Math.round(score));
};

const sortByScoreDesc = (items) => [...items].sort((a, b) => b.matchScore - a.matchScore);

module.exports = {
  normalizeText,
  destinationScore,
  budgetScore,
  scoreTripForUser,
  scoreTravelerForUser,
  scoreTravelerForTrip,
  sortByScoreDesc,
  getPreferredDestinations,
};
