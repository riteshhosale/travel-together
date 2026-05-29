const PREFERENCES_STORAGE_PREFIX = 'fg.preferences';

export const DEFAULT_PREFERENCES = {
  preferredBudget: '',
  preferredDestination: '',
  travelStyle: 'any',
  bio: '',
  reducedMotion: false,
};

export const getPreferencesStorageKey = (userId) =>
  `${PREFERENCES_STORAGE_PREFIX}:${userId || 'guest'}`;