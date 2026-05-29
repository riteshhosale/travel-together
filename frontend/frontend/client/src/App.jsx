import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { apiFetch } from './services/apiFetch';
import { isAuthenticated } from './services/auth';
import Toast from './components/Toast';
import { NOTIFY_EVENT } from './services/notify';
import { useAppContext } from './context/AppContext';

const Home = lazy(() => import('./pages/Home'));
const Trips = lazy(() => import('./pages/Trips'));
const TripDetail = lazy(() => import('./pages/TripDetail'));
const CreateTrip = lazy(() => import('./pages/CreateTrip'));
const Feed = lazy(() => import('./pages/Feed'));
const AI = lazy(() => import('./pages/AI'));
const Chat = lazy(() => import('./pages/Chat'));
const GpsNavigator = lazy(() => import('./pages/GpsNavigator'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Match = lazy(() => import('./pages/Match'));

function RouteFallback() {
  return (
    <div className='fg-page flex min-h-[40vh] items-center justify-center px-6'>
      <div className='fg-card p-6 text-center'>
        <p className='fg-muted text-sm'>Loading page...</p>
      </div>
    </div>
  );
}

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function App() {
  const navigate = useNavigate();
  const { preferences } = useAppContext();
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    document.documentElement.classList.toggle(
      'fg-reduced-motion',
      Boolean(preferences.reducedMotion)
    );
  }, [preferences.reducedMotion]);

  useEffect(() => {
    if (!isAuthenticated()) {
      return undefined;
    }

    let cancelled = false;

    apiFetch('/auth/me').catch((err) => {
      if (!cancelled && (err?.staleSession || /session/i.test(err?.message || ''))) {
        navigate('/login', {
          replace: true,
          state: { message: 'Your session expired. Please sign in again.' },
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    try {
      const hasVisited = localStorage.getItem('hasVisited');
      const path = window.location.pathname || '/';
      const isAuthOrLegalPage = [
        '/register',
        '/login',
        '/terms',
        '/privacy',
        '/forgot-password',
        '/reset-password',
      ].includes(path);

      if (!isAuthenticated() && !hasVisited && !isAuthOrLegalPage) {
        localStorage.setItem('hasVisited', '1');

        try {
          const defaultEmail = process.env.REACT_APP_DEFAULT_USER_EMAIL;
          const cleanupToken = process.env.REACT_APP_CLEANUP_TOKEN;

          if (defaultEmail && cleanupToken) {
            fetch(
              `${process.env.REACT_APP_API_URL || ''}/internal/delete-default-user?email=${encodeURIComponent(defaultEmail)}`,
              {
                method: 'POST',
                headers: {
                  'x-cleanup-token': cleanupToken,
                },
              }
            ).catch(() => {});
          }
        } catch (e) {
          // ignore
        }

        setToast({
          message: 'Create an account to save trips, use AI tools, and keep your plans in sync.',
          type: 'info',
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleNotify = (event) => {
      const detail = event.detail || {};
      setToast({
        message: detail.message || '',
        type: detail.type || 'info',
      });
    };

    window.addEventListener(NOTIFY_EVENT, handleNotify);

    return () => {
      window.removeEventListener(NOTIFY_EVENT, handleNotify);
    };
  }, []);

  useEffect(() => {
    if (!toast.message) return undefined;

    const timer = window.setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          <Route path='/terms' element={<Terms />} />
          <Route path='/privacy' element={<Privacy />} />
          <Route
            path='/trips'
            element={
              <Protected>
                <Trips />
              </Protected>
            }
          />
          <Route
            path='/trips/:id'
            element={
              <Protected>
                <TripDetail />
              </Protected>
            }
          />
          <Route
            path='/create-trip'
            element={
              <Protected>
                <CreateTrip />
              </Protected>
            }
          />
          <Route
            path='/feed'
            element={
              <Protected>
                <Feed />
              </Protected>
            }
          />
          <Route
            path='/ai'
            element={
              <Protected>
                <AI />
              </Protected>
            }
          />
          <Route
            path='/chat'
            element={
              <Protected>
                <Chat />
              </Protected>
            }
          />
          <Route
            path='/gps'
            element={
              <Protected>
                <GpsNavigator />
              </Protected>
            }
          />
          <Route
            path='/reviews'
            element={
              <Protected>
                <Reviews />
              </Protected>
            }
          />
          <Route
            path='/profile'
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route
            path='/settings'
            element={
              <Protected>
                <Settings />
              </Protected>
            }
          />
          <Route
            path='/match'
            element={
              <Protected>
                <Match />
              </Protected>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
