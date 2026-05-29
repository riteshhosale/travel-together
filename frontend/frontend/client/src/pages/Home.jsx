import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import SectionHeader from '../components/SectionHeader';
import Stats from '../components/Stats';
import { apiFetch } from '../services/apiFetch';

function Home() {
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    apiFetch('/stats')
      .then(setLiveStats)
      .catch(() => setLiveStats(null));
  }, []);
  const features = [
    {
      title: 'MirrorTrip Chat',
      description:
        'Coordinate plans, updates, and shared moments with your trip group in one clean collaboration space.',
      to: '/chat?feature=MirrorTrip',
    },
    {
      title: 'GPS Navigator',
      description:
        'Open travel-friendly navigation tools, track your live location, and move with more confidence.',
      to: '/gps',
    },
    {
      title: 'TravelGPT Assistant',
      description:
        'Ask for routes, ideas, packing guidance, or quick itineraries without switching between apps.',
      to: '/ai?feature=TravelGPT%20Assistant',
    },
    {
      title: 'Trip planner AI',
      description: 'Generate a simple day-by-day outline for any destination in seconds.',
      to: '/ai?feature=trip-plan',
    },
  ];

  const steps = [
    {
      title: 'Create or discover trips',
      description:
        'Launch your own trip or browse published journeys with clear dates, budgets, and expectations.',
    },
    {
      title: 'Match with the right people',
      description:
        'Use your preferences to find compatible trips and travelers who share your destinations and budget.',
      to: '/match',
    },
    {
      title: 'Coordinate everything faster',
      description:
        'Use chat, reviews, AI help, and shared planning tools to keep every detail under control.',
    },
  ];

  const trustPoints = [
    'Clean trip discovery with useful, decision-friendly details',
    'Integrated AI planning for faster travel prep',
    'Shared chat and review flows that feel product-ready',
    'Responsive UI built for real mobile usage',
  ];

  return (
    <div className='fg-page min-h-screen'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-orb fg-orb-3' aria-hidden='true' />
      <div className='fg-page-content'>
        <Navbar />

        <main className='mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-10'>
          <section id='home' className='fg-hero-grid items-center gap-8'>
            <div className='fg-section fg-rise'>
              <div className='fg-badge-row mb-6'>
                <span className='fg-chip text-[11px] font-semibold uppercase tracking-[0.22em]'>
                  Premium travel coordination
                </span>
                <span className='fg-chip text-[11px] font-semibold uppercase tracking-[0.22em]'>
                  Modern product UI
                </span>
              </div>

              <SectionHeader
                kicker='TravelTogether'
                title='Plan trips with the right people, smarter tools, and a cleaner experience.'
                subtitle='TravelTogether turns scattered planning into one polished flow — discover trips, connect with compatible travelers, coordinate details, and use AI support to move faster from idea to itinerary.'
              />

              <div className='mt-8 flex flex-col gap-4 sm:flex-row'>
                <Link
                  to='/create-trip'
                  className='fg-btn-primary text-center text-sm transition hover:brightness-110'
                >
                  Create a trip
                </Link>
                <Link
                  to='/trips'
                  className='fg-btn-secondary text-center text-sm transition hover:border-cyan-300 hover:text-cyan-300'
                >
                  Explore trips
                </Link>
              </div>

              <div className='mt-10 grid gap-4 sm:grid-cols-3'>
                {[
                  {
                    value: liveStats ? String(liveStats.tripsCreated) : '—',
                    label: 'Trips launched',
                  },
                  {
                    value: liveStats?.averageRating ? `${liveStats.averageRating}/5` : '—',
                    label: 'Traveler satisfaction',
                  },
                  {
                    value: liveStats ? String(liveStats.travelers) : '—',
                    label: 'Active travelers',
                  },
                ].map((item) => (
                  <div key={item.label} className='fg-card p-5'>
                    <p className='fg-title text-2xl font-black'>{item.value}</p>
                    <p className='fg-muted mt-2 text-sm'>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className='fg-card fg-hero-panel p-6 sm:p-8'>
              <div className='flex items-center gap-4'>
                <div className='fg-logo-mark h-16 w-16'>
                  <img
                    src='/logo.png'
                    alt='TravelTogether logo'
                    className='h-14 w-14 rounded-[1.25rem] object-cover'
                  />
                </div>
                <div>
                  <p className='fg-kicker text-xs font-semibold uppercase'>Smart trip workspace</p>
                  <h3 className='fg-title mt-2 text-2xl font-bold'>Everything in one flow</h3>
                </div>
              </div>

              <div className='mt-8 space-y-4'>
                {[
                  'Browse destinations and compare trip details quickly',
                  'Join travel conversations without leaving the platform',
                  'Use ratings, reviews, and AI assistance before deciding',
                ].map((item) => (
                  <div key={item} className='fg-card p-4'>
                    <p className='fg-muted text-sm'>{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section id='stats' className='pt-10'>
            <Stats />
          </section>

          <section id='how-it-works' className='fg-section mt-10 fg-rise'>
            <SectionHeader
              kicker='How it works'
              title='A simpler workflow from idea to itinerary'
              subtitle='The platform is structured to reduce friction at every step — discovery, matching, planning, and group coordination.'
            />

            <div className='mt-8 grid gap-4 md:grid-cols-3'>
              {steps.map((step, index) => (
                <article key={step.title} className='fg-card fg-card-hover p-6'>
                  <p className='fg-kicker text-xs font-semibold uppercase'>0{index + 1}</p>
                  <h3 className='fg-title mt-4 text-xl font-bold'>{step.title}</h3>
                  <p className='fg-muted mt-3 text-sm leading-7'>{step.description}</p>
                  {step.to && (
                    <Link to={step.to} className='fg-btn-secondary mt-4 inline-block text-xs'>
                      Open matching
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section id='features' className='fg-section mt-10 fg-rise'>
            <SectionHeader
              kicker='Core features'
              title='Tools that make shared travel feel professional'
              subtitle='Instead of juggling separate apps, use a consistent workspace for planning, communication, navigation, and travel insights.'
            />
            <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                  to={feature.to}
                />
              ))}
            </div>
          </section>

          <section id='trust' className='fg-section mt-10 fg-rise'>
            <div className='grid gap-8 lg:grid-cols-2'>
              <SectionHeader
                kicker='Why it feels better'
                title='Designed like a real product, not just a class project'
                subtitle='The redesign focuses on stronger hierarchy, better spacing, more consistent components, and clearer user flows so the site feels more credible and polished.'
              />
              <div className='grid gap-4'>
                {trustPoints.map((item) => (
                  <div key={item} className='fg-card fg-card-hover p-5'>
                    <p className='fg-title text-base font-semibold'>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className='fg-section mt-10 text-center fg-rise'>
            <SectionHeader
              kicker='Ready to explore?'
              title='Start your next journey with a better travel experience'
              subtitle='Create a trip, explore community activity, and coordinate plans with tools that feel more polished from the first screen.'
              align='center'
            />
            <div className='mt-8 flex flex-col justify-center gap-4 sm:flex-row'>
              <Link to='/create-trip' className='fg-btn-primary text-sm'>
                Start your journey
              </Link>
              <Link to='/ai?feature=TravelGPT%20Assistant' className='fg-btn-secondary text-sm'>
                Try TravelGPT
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default Home;
