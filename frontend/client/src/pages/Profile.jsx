import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiFetch';
import { isAuthenticated } from '../services/auth';
import { notify } from '../services/notify';

const normalizeBase = (base) => String(base || '').replace(/\/+$/, '');

const resolveAssetBase = () => {
  const rawBase =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://travel-together-backend.onrender.com');
  const base = normalizeBase(rawBase);
  return base.endsWith('/api') ? base.slice(0, -4) : base;
};

const buildImageUrl = (value) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${resolveAssetBase()}${normalizedPath}`;
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const imageInputRef = useRef(null);

  const displayName = name || profile?.name || 'Traveler';
  const displayEmail = email || profile?.email || 'No email';
  const displayLocation = location || profile?.location || 'Not set';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently joined';
  const profileStrength = Math.min(
    100,
    [displayName, displayEmail, displayLocation, profile?.createdAt].filter(Boolean).length * 25
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        if (!isAuthenticated()) {
          setError('Login required to view profile.');
          return;
        }

        const data = await apiFetch('/users/profile');

        setProfile(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setLocation(data.location || '');
        setImagePreviewUrl(buildImageUrl(data.profileImage));
      } catch (err) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      if (!isAuthenticated()) {
        notify({ message: 'Login required to update profile.', type: 'error' });
        return;
      }

      const payload = {
        name,
        email,
        location,
      };
      if (password) {
        payload.password = password;
      }

      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('email', payload.email);
      formData.append('location', payload.location);

      if (password) {
        formData.append('password', password);
      }

      if (removeAvatar) {
        formData.append('removeAvatar', 'true');
      }

      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      const data = await apiFetch('/users/profile', {
        method: 'PUT',
        body: formData,
      });

      setProfile(data);
      setImagePreviewUrl(buildImageUrl(data.profileImage));
      setImageFile(null);
      setRemoveAvatar(false);
      setPassword('');
      notify({ message: 'Profile updated.', type: 'success' });
    } catch (err) {
      notify({
        message: err?.message || 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onImageChange = (event) => {
    const selected = event.target.files && event.target.files[0];

    if (!selected) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImageFile(selected);
      setImagePreviewUrl(String(reader.result || ''));
      setRemoveAvatar(false);
    };

    reader.readAsDataURL(selected);
  };

  const onRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl('');
    setRemoveAvatar(Boolean(profile?.profileImage));

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-page-content mx-auto w-full max-w-6xl fg-rise'>
        <div className='mb-8'>
          <div className='fg-section relative overflow-hidden'>
            <div className='pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl' />
            <div className='pointer-events-none absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl' />
            <div className='relative z-10 flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='fg-kicker text-xs font-semibold uppercase'>Enterprise profile</p>
                <h1 className='fg-title mt-3 text-3xl font-black sm:text-4xl'>
                  Account Command Center
                </h1>
                <p className='fg-muted mt-3 max-w-2xl text-sm leading-7 sm:text-base'>
                  Manage identity, account trust, and travel readiness from one professional profile
                  workspace.
                </p>
              </div>
              <BackButton />
            </div>
          </div>
        </div>

        <div className='grid gap-8 lg:grid-cols-[0.85fr_1.15fr]'>
          <aside className='space-y-6'>
            <div className='fg-card p-6'>
              <div className='flex items-center gap-4'>
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt='Profile'
                    className='h-[4.5rem] w-[4.5rem] rounded-[1.4rem] border border-slate-300/20 object-cover'
                  />
                ) : (
                  <div className='fg-profile-avatar'>{displayName.slice(0, 1).toUpperCase()}</div>
                )}
                <div>
                  <p className='fg-kicker text-xs font-semibold uppercase'>Executive profile</p>
                  <h2 className='fg-title mt-2 text-2xl font-bold'>{displayName}</h2>
                  <p className='fg-muted mt-1 text-sm'>{displayEmail}</p>
                </div>
              </div>

              <div className='mt-6 space-y-3'>
                <div className='fg-card p-4'>
                  <p className='fg-muted text-xs font-semibold uppercase tracking-[0.22em]'>
                    Profile image
                  </p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <input
                      ref={imageInputRef}
                      id='profile-image-input'
                      type='file'
                      accept='image/*'
                      onChange={onImageChange}
                      className='hidden'
                    />
                    <label
                      htmlFor='profile-image-input'
                      className='fg-btn-secondary cursor-pointer text-xs'
                    >
                      Upload image
                    </label>
                    <button
                      type='button'
                      onClick={onRemoveImage}
                      className='fg-btn-secondary text-xs'
                    >
                      Remove image
                    </button>
                  </div>
                </div>

                <div className='fg-card p-4'>
                  <p className='fg-muted text-xs font-semibold uppercase tracking-[0.22em]'>
                    Account status
                  </p>
                  <p className='fg-title mt-2 text-sm font-semibold'>Active</p>
                  <Link to='/settings' className='fg-muted mt-2 inline-block text-xs text-cyan-300 hover:underline'>
                    Change password in Settings
                  </Link>
                </div>
                <div className='fg-card p-4'>
                  <p className='fg-muted text-xs font-semibold uppercase tracking-[0.22em]'>
                    Home base
                  </p>
                  <p className='fg-title mt-2 text-sm font-semibold'>{displayLocation}</p>
                </div>
                <div className='fg-card p-4'>
                  <p className='fg-muted text-xs font-semibold uppercase tracking-[0.22em]'>
                    Member since
                  </p>
                  <p className='fg-title mt-2 text-sm font-semibold'>{memberSince}</p>
                </div>
                <div className='fg-card p-4'>
                  <div className='flex items-center justify-between'>
                    <p className='fg-muted text-xs font-semibold uppercase tracking-[0.22em]'>
                      Profile strength
                    </p>
                    <p className='fg-title text-sm font-bold'>{profileStrength}%</p>
                  </div>
                  <div className='mt-3 h-2 rounded-full bg-slate-700/60'>
                    <div
                      className='h-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300'
                      style={{ width: `${profileStrength}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className='fg-card p-6'>
              <p className='fg-title text-lg font-bold'>Trust and visibility</p>
              <p className='fg-muted mt-3 text-sm leading-7'>
                Complete profiles are ranked better in discovery surfaces and improve acceptance
                rates for shared itineraries.
              </p>
              <div className='mt-4 flex flex-wrap gap-2 text-xs'>
                <span className='fg-chip'>Identity aligned</span>
                <span className='fg-chip'>Data complete</span>
                <span className='fg-chip'>Secure account</span>
              </div>
            </div>
          </aside>

          <section className='fg-section'>
            <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='fg-kicker text-xs font-semibold uppercase'>Account settings</p>
                <h2 className='fg-title mt-4 text-4xl font-black'>Profile administration</h2>
                <p className='fg-muted mt-3 max-w-xl text-sm leading-7 sm:text-base'>
                  Keep records accurate to maintain a trusted presence and ensure clean handoffs
                  across travel planning workflows.
                </p>
              </div>
            </div>

            {error && <div className='fg-alert mb-6 px-4 py-3 text-sm'>{error}</div>}

            <div className='mb-6 grid gap-4 sm:grid-cols-3'>
              <div className='fg-card p-4'>
                <p className='fg-muted text-xs uppercase tracking-[0.22em]'>Region</p>
                <p className='fg-title mt-2 text-lg font-bold'>{displayLocation}</p>
              </div>
              <div className='fg-card p-4'>
                <p className='fg-muted text-xs uppercase tracking-[0.22em]'>Profile completeness</p>
                <p className='fg-title mt-2 text-lg font-bold'>{profileStrength}%</p>
              </div>
              <div className='fg-card p-4'>
                <p className='fg-muted text-xs uppercase tracking-[0.22em]'>Legal</p>
                <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                  <Link to='/terms' className='text-cyan-300 hover:underline'>
                    Terms
                  </Link>
                  <Link to='/privacy' className='text-cyan-300 hover:underline'>
                    Privacy
                  </Link>
                </div>
              </div>
            </div>

            {isLoading ? (
              <p className='fg-muted text-sm'>Loading profile...</p>
            ) : (
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='fg-muted text-xs font-semibold'>Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='fg-input mt-2 text-sm'
                  />
                </div>

                <div>
                  <label className='fg-muted text-xs font-semibold'>Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='fg-input mt-2 text-sm'
                  />
                </div>

                <div>
                  <label className='fg-muted text-xs font-semibold'>Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className='fg-input mt-2 text-sm'
                  />
                </div>

                <div>
                  <label className='fg-muted text-xs font-semibold'>New password</label>
                  <div className='mt-2 flex gap-2'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder='Leave blank to keep current'
                      className='fg-input text-sm'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((value) => !value)}
                      className='fg-btn-secondary whitespace-nowrap text-xs'
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className='mt-6 flex flex-wrap gap-3'>
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className='fg-btn-primary text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type='button'
                onClick={() => setPassword('')}
                className='fg-btn-secondary text-sm'
              >
                Clear password field
              </button>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Profile;
