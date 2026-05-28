import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className='fg-footer mt-16'>
      <div className='mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
        <div className='fg-footer-shell grid gap-8 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr]'>
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='fg-logo-mark h-12 w-12'>
                <img
                  src='/logo.png'
                  alt='TravelTogether logo'
                  className='h-10 w-10 rounded-2xl object-cover'
                />
              </div>
              <div>
                <h6 className='fg-title text-sm font-semibold uppercase tracking-[0.22em]'>
                  TravelTogether
                </h6>
                <p className='fg-muted text-xs'>Travel better with the right people.</p>
              </div>
            </div>
            <p className='fg-muted max-w-md text-sm'>
              A cleaner, smarter way to discover trips, coordinate with travel companions, and plan
              your entire journey from one place.
            </p>
          </div>

          <nav className='flex flex-col gap-3'>
            <h6 className='fg-title text-xs font-semibold uppercase tracking-[0.22em]'>Explore</h6>
            <Link to='/' className='fg-nav-link text-sm'>
              Home
            </Link>
            <Link to='/trips' className='fg-nav-link text-sm'>
              Trips
            </Link>
            <Link to='/match' className='fg-nav-link text-sm'>
              Match
            </Link>
            <Link to='/create-trip' className='fg-nav-link text-sm'>
              Create Trip
            </Link>
            <Link to='/feed' className='fg-nav-link text-sm'>
              Community Feed
            </Link>
          </nav>

          <nav className='flex flex-col gap-3'>
            <h6 className='fg-title text-xs font-semibold uppercase tracking-[0.22em]'>Tools</h6>
            <Link to='/ai?feature=TravelGPT%20Assistant' className='fg-nav-link text-sm'>
              TravelGPT
            </Link>
            <Link to='/gps' className='fg-nav-link text-sm'>
              GPS Navigator
            </Link>
            <Link to='/chat' className='fg-nav-link text-sm'>
              Trip Chat
            </Link>
            <Link to='/reviews' className='fg-nav-link text-sm'>
              Reviews
            </Link>
          </nav>

          <div className='space-y-3'>
            <h6 className='fg-title text-xs font-semibold uppercase tracking-[0.22em]'>
              Product promise
            </h6>
            <p className='fg-muted text-sm'>
              Designed to feel less like a student project and more like a polished travel product
              people would actually trust and use.
            </p>
            <div className='flex flex-wrap gap-3 text-xs'>
              <a
                href='https://travel-together-o41z.onrender.com/'
                target='_blank'
                rel='noreferrer'
                className='fg-nav-link'
              >
                Live site
              </a>
              <Link to='/terms' className='fg-nav-link'>
                Terms
              </Link>
              <Link to='/privacy' className='fg-nav-link'>
                Privacy
              </Link>
              <Link to='/settings' className='fg-nav-link'>
                Settings
              </Link>
            </div>
            <p className='fg-muted text-xs'>© 2026 TravelTogether. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
