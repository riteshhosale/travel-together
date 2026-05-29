import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearToken, isAuthenticated } from '../services/auth';

function Navbar() {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    setMenuOpen(false);
    navigate('/');
  };

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Trips', to: '/trips' },
    { label: 'Match', to: '/match' },
    { label: 'Feed', to: '/feed' },
    { label: 'Chat', to: '/chat' },
    { label: 'AI', to: '/ai' },
    { label: 'GPS', to: '/gps' },
    { label: 'Reviews', to: '/reviews' },
  ];

  const authButtons = authed ? (
    <>
      <Link to='/profile' className='fg-btn-secondary text-xs' onClick={() => setMenuOpen(false)}>
        Profile
      </Link>
      <Link to='/settings' className='fg-btn-secondary text-xs' onClick={() => setMenuOpen(false)}>
        Settings
      </Link>
      <button onClick={handleLogout} className='fg-btn-primary text-xs'>
        Logout
      </button>
    </>
  ) : (
    <>
      <Link to='/login' className='fg-btn-secondary text-xs' onClick={() => setMenuOpen(false)}>
        Login
      </Link>
      <Link to='/register' className='fg-btn-primary text-xs' onClick={() => setMenuOpen(false)}>
        Sign up
      </Link>
    </>
  );

  return (
    <header className='fg-navbar sticky top-0 z-30 px-4 py-4 sm:px-6 lg:px-8'>
      <div className='fg-navbar-shell mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <Link to='/' className='flex items-center gap-3' onClick={() => setMenuOpen(false)}>
            <div className='fg-logo-mark'>
              <img
                src='/logo.png'
                alt='TravelTogether logo'
                className='h-10 w-10 rounded-2xl object-cover'
              />
            </div>
            <div>
              <span className='fg-title block text-lg font-bold tracking-wide'>TravelTogether</span>
              <span className='fg-muted text-xs'>Professional trip planning, together</span>
            </div>
          </Link>

          <button
            type='button'
            className='fg-btn-secondary text-xs lg:hidden'
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label='Toggle menu'
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <div
          className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end ${menuOpen ? '' : 'hidden lg:flex'}`}
        >
          <nav className='fg-nav-wrap fg-nav-mobile-panel flex flex-wrap items-center gap-2 text-sm sm:gap-3'>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `fg-nav-pill ${isActive ? 'fg-nav-pill-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className='flex flex-wrap items-center gap-3'>{authButtons}</div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
