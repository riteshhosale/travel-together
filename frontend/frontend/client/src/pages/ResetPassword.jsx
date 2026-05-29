import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { notify } from '../services/notify';
import { apiFetch } from '../services/apiFetch';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!token.trim()) {
      notify({ message: 'Reset token is required.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      notify({ message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      notify({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      notify({ message: data.message, type: 'success' });
      navigate('/login', { replace: true });
    } catch (err) {
      notify({ message: err?.message || 'Reset failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-page-content mx-auto max-w-lg fg-rise'>
        <BackButton />
        <section className='fg-section mt-8'>
          <p className='fg-kicker text-xs font-semibold uppercase'>Account recovery</p>
          <h1 className='fg-title mt-4 text-3xl font-black'>Set a new password</h1>
          <p className='fg-muted mt-4 text-sm leading-7'>
            Paste the token from your email if it is not already filled in.
          </p>

          <form onSubmit={submit} className='mt-6 space-y-4'>
            <div>
              <label className='fg-muted text-xs font-semibold'>Reset token</label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className='fg-input mt-2 w-full text-sm'
                placeholder='Token from email'
                required
              />
            </div>
            <div>
              <label className='fg-muted text-xs font-semibold'>New password</label>
              <input
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className='fg-input mt-2 w-full text-sm'
                minLength={6}
                required
              />
            </div>
            <div>
              <label className='fg-muted text-xs font-semibold'>Confirm password</label>
              <input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='fg-input mt-2 w-full text-sm'
                minLength={6}
                required
              />
            </div>
            <button
              type='submit'
              disabled={isSubmitting}
              className='fg-btn-primary w-full text-sm disabled:opacity-70'
            >
              {isSubmitting ? 'Saving...' : 'Update password'}
            </button>
          </form>

          <p className='fg-muted mt-6 text-center text-sm'>
            <Link to='/forgot-password' className='text-cyan-300 hover:underline'>
              Request a new link
            </Link>
          </p>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default ResetPassword;
