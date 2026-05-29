import { DEFAULT_PREFERENCES, getPreferencesStorageKey } from './preferencesStorage';

describe('preferences storage helpers', () => {
  it('scopes the storage key to the active user', () => {
    expect(getPreferencesStorageKey('user-1')).toBe('fg.preferences:user-1');
    expect(getPreferencesStorageKey('')).toBe('fg.preferences:guest');
  });

  it('provides the default preference shape', () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      preferredBudget: '',
      preferredDestination: '',
      travelStyle: 'any',
      bio: '',
      reducedMotion: false,
    });
  });
});
