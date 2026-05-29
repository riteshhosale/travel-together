import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';

function Settings() {
  const { preferences, setPreferences } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const profile = await apiFetch('/users/profile');
        const travelPreferences = profile?.travelPreferences || {};

        setPreferences((prev) => ({
          ...prev,
          preferredDestination:
            travelPreferences.preferredDestinations?.[0] || prev.preferredDestination || '',
          preferredBudget:
            travelPreferences.budgetMax !== undefined && travelPreferences.budgetMax !== null
              ? String(travelPreferences.budgetMax)
              : prev.preferredBudget || '',
          travelStyle: travelPreferences.travelStyle || prev.travelStyle || 'any',
          bio: travelPreferences.bio || prev.bio || '',
        }));
      } catch {
        // Keep local preferences if the profile fetch fails.
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePreferences = async () => {
    try {
      setIsSavingPrefs(true);

      const budgetValue =
        preferences.preferredBudget !== '' ? Number(preferences.preferredBudget) : undefined;

      await apiFetch('/users/match-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          preferredDestination: preferences.preferredDestination,
          preferredDestinations: preferences.preferredDestination
            ? [preferences.preferredDestination]
            : [],
          budgetMax: budgetValue,
          budgetMin: budgetValue !== undefined ? Math.max(0, budgetValue * 0.5) : undefined,
          travelStyle: preferences.travelStyle || 'any',
          bio: preferences.bio || '',
        }),
      });

      notify({ message: 'Match preferences saved to your account.', type: 'success' });
    } catch (err) {
      notify({ message: err?.message || 'Failed to save preferences', type: 'error' });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      notify({ message: 'Enter current and new password.', type: 'error' });
      return;
    }

    try {
      setIsSavingPassword(true);
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      notify({ message: 'Password updated.', type: 'success' });
    } catch (err) {
      notify({ message: err?.message || 'Failed to update password', type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-page-content mx-auto max-w-3xl fg-rise'>
        <div className='mb-8 flex items-start justify-between gap-4'>
          <div>
            <p className='fg-kicker text-xs font-semibold uppercase'>Settings</p>
            <h1 className='fg-title mt-3 text-3xl font-black'>Your preferences</h1>
          </div>
          <BackButton />
        </div>

        <section className='fg-section space-y-6'>
          <div className='fg-card p-6'>
            <h2 className='fg-title text-lg font-bold'>Travel matching</h2>
            <p className='fg-muted mt-2 text-sm'>
              Used by the Match page to recommend trips and travelers. Saved to your account.
            </p>
            {isLoading ? (
              <p className='fg-muted mt-4 text-sm'>Loading preferences...</p>
            ) : (
              <>
                <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                  <div>
                    <label className='fg-muted text-xs font-semibold'>Preferred destination</label>
                    <input
                      value={preferences.preferredDestination}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          preferredDestination: e.target.value,
                        }))
                      }
                      className='fg-input mt-2 text-sm'
                      placeholder='e.g. Goa'
                    />
                  </div>
                  <div>
                    <label className='fg-muted text-xs font-semibold'>Max budget</label>
                    <input
                      value={preferences.preferredBudget}
                      onChange={(e) =>
                        setPreferences((prev) => ({ ...prev, preferredBudget: e.target.value }))
                      }
                      className='fg-input mt-2 text-sm'
                      placeholder='e.g. 50000'
                      inputMode='numeric'
                    />
                  </div>
                  <div>
                    <label className='fg-muted text-xs font-semibold'>Travel style</label>
                    <select
                      value={preferences.travelStyle || 'any'}
                      onChange={(e) =>
                        setPreferences((prev) => ({ ...prev, travelStyle: e.target.value }))
                      }
                      className='fg-input mt-2 text-sm'
                    >
                      <option value='any'>Any</option>
                      <option value='relaxed'>Relaxed</option>
                      <option value='adventure'>Adventure</option>
                      <option value='cultural'>Cultural</option>
                    </select>
                  </div>
                  <div className='sm:col-span-2'>
                    <label className='fg-muted text-xs font-semibold'>Short bio</label>
                    <textarea
                      value={preferences.bio || ''}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, bio: e.target.value }))}
                      className='fg-input mt-2 min-h-[80px] text-sm'
                      placeholder='What kind of trips do you enjoy?'
                    />
                  </div>
                </div>
                <label className='mt-4 flex items-center gap-3 text-sm'>
                  <input
                    type='checkbox'
                    checked={Boolean(preferences.reducedMotion)}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, reducedMotion: e.target.checked }))
                    }
                  />
                  <span className='fg-muted'>Reduce motion effects</span>
                </label>
                <button
                  onClick={savePreferences}
                  disabled={isSavingPrefs}
                  className='fg-btn-primary mt-4 text-sm disabled:opacity-70'
                >
                  {isSavingPrefs ? 'Saving...' : 'Save match preferences'}
                </button>
              </>
            )}
          </div>

          <div className='fg-card p-6'>
            <h2 className='fg-title text-lg font-bold'>Change password</h2>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='fg-muted text-xs font-semibold'>Current password</label>
                <input
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>
              <div>
                <label className='fg-muted text-xs font-semibold'>New password</label>
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>
            </div>
            <button
              onClick={changePassword}
              disabled={isSavingPassword}
              className='fg-btn-primary mt-4 text-sm disabled:opacity-70'
            >
              {isSavingPassword ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default Settings;
