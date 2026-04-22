import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { notify } from '../services/notify';
import { apiFetch } from '../services/apiFetch';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      notify({ message: 'Enter your email address.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      setSubmitted(true);
      notify({ message: data.message, type: 'success' });
    } catch (err) {
      notify({ message: err?.message || 'Could not send reset email', type: 'error' });
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
          <h1 className='fg-title mt-4 text-3xl font-black'>Forgot password</h1>
          <p className='fg-muted mt-4 text-sm leading-7'>
            Enter your email and we will send a reset link if an account exists.
          </p>

          {submitted ? (
            <div className='fg-card mt-6 p-5'>
              <p className='fg-muted text-sm leading-7'>
                Check your inbox for the reset link. In development without SMTP, the link is
                printed in the backend server console.
              </p>
              <Link to='/login' className='fg-btn-primary mt-4 inline-block text-sm'>
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className='mt-6 space-y-4'>
              <div>
                <label className='fg-muted text-xs font-semibold'>Email</label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='fg-input mt-2 w-full text-sm'
                  placeholder='you@example.com'
                  required
                />
              </div>
              <button
                type='submit'
                disabled={isSubmitting}
                className='fg-btn-primary w-full text-sm disabled:opacity-70'
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className='fg-muted mt-6 text-center text-sm'>
            Remembered it?{' '}
            <Link to='/login' className='text-cyan-300 hover:underline'>
              Sign in
            </Link>
          </p>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default ForgotPassword;
