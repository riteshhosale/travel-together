import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { setToken } from '../services/auth';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionMessage = location.state?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = location.state?.from || '/';

  const login = async () => {
    if (!email || !password) {
      notify({
        message: 'Please enter both email and password.',
        type: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data?.token) {
        setToken(data.token);
      }
      notify({ message: 'Login successful', type: 'success' });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      notify({
        message: err?.message || 'Login failed. Try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fg-page min-h-screen px-4 py-10 sm:py-12'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-page-content mx-auto w-full max-w-6xl fg-rise'>
        <div className='grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center'>
          <section className='fg-section'>
            {sessionMessage && (
              <div className='fg-alert mb-6 px-4 py-3 text-sm'>{sessionMessage}</div>
            )}
            <p className='fg-kicker text-xs font-semibold uppercase'>Welcome back</p>
            <h1 className='fg-title mt-4 text-4xl font-black sm:text-5xl'>
              Sign in and continue planning like a pro.
            </h1>
            <p className='fg-muted mt-5 max-w-xl text-sm leading-7 sm:text-base'>
              Access your trips, community feed, reviews, and travel tools from one polished
              dashboard designed to make coordination easier.
            </p>

            <div className='mt-8 grid gap-4 sm:grid-cols-3'>
              {[
                'Manage active trips',
                'Reconnect with your travel group',
                'Continue planning with AI',
              ].map((item) => (
                <div key={item} className='fg-card p-4'>
                  <p className='fg-muted text-sm'>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className='fg-card p-6 sm:p-8'>
            <div className='mb-6'>
              <p className='fg-kicker text-xs font-semibold uppercase'>Account access</p>
              <h2 className='fg-title mt-3 text-3xl font-bold'>Sign in</h2>
              <p className='fg-muted mt-2 text-sm'>
                Continue your journey with a cleaner, more professional workspace.
              </p>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='fg-muted text-xs font-semibold'>Email address</label>
                <input
                  placeholder='you@example.com'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>

              <div>
                <label className='fg-muted text-xs font-semibold'>Password</label>
                <div className='mt-2 flex gap-2'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

            <button
              onClick={login}
              disabled={isSubmitting}
              className='fg-btn-primary mt-6 w-full text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>

            <p className='fg-muted mt-5 text-center text-sm'>
              New here?{' '}
              <Link to='/register' className='fg-title font-semibold'>
                Create an account
              </Link>
            </p>
            <p className='fg-muted mt-3 text-center text-xs'>
              <Link to='/forgot-password' className='text-cyan-300 hover:underline'>
                Forgot password?
              </Link>
              {' · '}
              <Link to='/terms' className='hover:underline'>
                Terms
              </Link>
            </p>
          </section>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Login;
