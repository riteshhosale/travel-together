import BackButton from '../components/BackButton';
import Footer from '../components/Footer';

function Terms() {
  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-page-content mx-auto max-w-3xl fg-rise'>
        <BackButton />
        <section className='fg-section mt-8'>
          <p className='fg-kicker text-xs font-semibold uppercase'>Legal</p>
          <h1 className='fg-title mt-4 text-3xl font-black'>Terms of Service</h1>
          <div className='fg-muted mt-6 space-y-4 text-sm leading-7'>
            <p>
              TravelTogether helps people discover shared trips, coordinate plans, and use travel
              tools. By using this app you agree to provide accurate account information and respect
              other travelers.
            </p>
            <p>
              Trip organizers are responsible for their listings. Members join at their own
              discretion. We do not guarantee trip safety, availability, or third-party services
              such as maps or AI providers.
            </p>
            <p>
              Do not post illegal content, harassment, or misleading trip details. We may remove
              content or suspend accounts that violate these terms.
            </p>
            <p>
              Contact your trip admin for trip-specific disputes. For platform issues, use Profile
              settings.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default Terms;
