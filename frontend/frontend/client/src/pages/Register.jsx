import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import { setToken } from '../services/auth';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const featureName = searchParams.get('feature') || 'Create Account';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = async () => {
    if (!name || !email || !password) {
      notify({
        message: 'Name, email, and password are required.',
        type: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, location }),
      });

      if (data?.token) {
        setToken(data.token);
      }

      notify({ message: 'Account created. You are now signed in.', type: 'success' });
      navigate('/');
    } catch (err) {
      notify({
        message: err?.message || 'Registration failed. Try again.',
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
        <div className='grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-center'>
          <section className='fg-card p-6 sm:p-8'>
            <div className='mb-6'>
              <p className='fg-kicker text-xs font-semibold uppercase'>{featureName}</p>
              <h2 className='fg-title mt-3 text-3xl font-bold'>Create your account</h2>
              <p className='fg-muted mt-2 text-sm'>
                Join a more polished travel platform built for matching, planning, and better trip
                coordination.
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <label className='fg-muted text-xs font-semibold'>Full name</label>
                <input
                  placeholder='Jane Doe'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>

              <div className='sm:col-span-2'>
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

              <div>
                <label className='fg-muted text-xs font-semibold'>Home base</label>
                <input
                  placeholder='City, Country'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>
            </div>

            <button
              onClick={register}
              disabled={isSubmitting}
              className='fg-btn-primary mt-6 w-full text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isSubmitting ? 'Creating account...' : 'Register'}
            </button>

            <p className='fg-muted mt-5 text-center text-sm'>
              Already have an account?{' '}
              <Link to='/login' className='fg-title font-semibold'>
                Sign in
              </Link>
            </p>
          </section>

          <section className='fg-section'>
            <p className='fg-kicker text-xs font-semibold uppercase'>Why join</p>
            <h1 className='fg-title mt-4 text-4xl font-black sm:text-5xl'>
              Build better trips with better structure.
            </h1>
            <p className='fg-muted mt-5 max-w-xl text-sm leading-7 sm:text-base'>
              TravelTogether helps you move from rough ideas to real plans with cleaner discovery,
              stronger trip collaboration, and an interface that feels more trustworthy from the
              start.
            </p>

            <div className='mt-8 grid gap-4 sm:grid-cols-3'>
              {[
                'Create and discover trips faster',
                'Use reviews and chat to plan with confidence',
                'Get AI help without leaving the platform',
              ].map((item) => (
                <div key={item} className='fg-card p-4'>
                  <p className='fg-muted text-sm'>{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Register;
