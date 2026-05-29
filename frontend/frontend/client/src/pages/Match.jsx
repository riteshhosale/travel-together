import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import SectionHeader from '../components/SectionHeader';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';

const renderScore = (score) => {
  if (score >= 70) return 'Excellent match';
  if (score >= 50) return 'Good match';
  if (score >= 30) return 'Possible match';
  return 'Explore';
};

function Match() {
  const [tab, setTab] = useState('trips');
  const [tripMatches, setTripMatches] = useState([]);
  const [travelerMatches, setTravelerMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [tripsData, travelersData] = await Promise.all([
          apiFetch('/match/trips'),
          apiFetch('/match/travelers'),
        ]);
        setTripMatches(tripsData.matches || []);
        setTravelerMatches(travelersData.matches || []);
      } catch (err) {
        setError(err?.message || 'Failed to load matches');
        notify({ message: err?.message || 'Failed to load matches', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className='fg-page min-h-screen px-4 py-10 sm:py-12'>
      <div className='fg-page-content mx-auto max-w-6xl fg-rise'>
        <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
          <SectionHeader
            kicker='Travel matching'
            title='Find the right trips and people'
            subtitle='Scores use your saved preferences, budget, destination interests, and travel style.'
          />
          <div className='flex flex-wrap gap-3'>
            <BackButton />
            <Link to='/settings' className='fg-btn-secondary text-xs'>
              Edit preferences
            </Link>
          </div>
        </div>

        <div className='mb-6 flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={() => setTab('trips')}
            className={`fg-btn-secondary text-sm ${tab === 'trips' ? 'border-cyan-300 text-cyan-300' : ''}`}
          >
            Matched trips
          </button>
          <button
            type='button'
            onClick={() => setTab('travelers')}
            className={`fg-btn-secondary text-sm ${tab === 'travelers' ? 'border-cyan-300 text-cyan-300' : ''}`}
          >
            Matched travelers
          </button>
        </div>

        {error && <div className='fg-alert mb-6 px-4 py-3 text-sm'>{error}</div>}

        {isLoading ? (
          <p className='fg-muted text-sm'>Finding matches...</p>
        ) : tab === 'trips' ? (
          tripMatches.length === 0 ? (
            <div className='fg-card p-6'>
              <p className='fg-muted text-sm'>
                No trip matches yet. Add preferences in Settings and explore published trips.
              </p>
              <Link to='/settings' className='fg-btn-primary mt-4 inline-block text-sm'>
                Update preferences
              </Link>
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2'>
              {tripMatches.map((trip) => (
                <article key={trip._id} className='fg-card p-6'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='fg-title text-xl font-semibold'>{trip.destination}</h3>
                    <span className='fg-chip text-[11px] font-semibold'>{trip.matchScore}%</span>
                  </div>
                  <p className='fg-muted mt-2 text-xs uppercase tracking-wide'>
                    {renderScore(trip.matchScore)}
                  </p>
                  <p className='fg-muted mt-3 text-sm'>
                    {trip.description || 'Shared trip opportunity'}
                  </p>
                  {Array.isArray(trip.matchReasons) && trip.matchReasons.length > 0 && (
                    <ul className='fg-muted mt-3 space-y-1 text-xs'>
                      {trip.matchReasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  )}
                  <Link to={`/trips/${trip._id}`} className='fg-btn-primary mt-4 inline-block text-sm'>
                    View trip
                  </Link>
                </article>
              ))}
            </div>
          )
        ) : travelerMatches.length === 0 ? (
          <div className='fg-card p-6'>
            <p className='fg-muted text-sm'>
              No traveler matches yet. Complete your profile and match preferences.
            </p>
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {travelerMatches.map((traveler) => (
              <article key={traveler._id} className='fg-card p-6'>
                <div className='flex items-start justify-between gap-3'>
                  <h3 className='fg-title text-lg font-semibold'>{traveler.name}</h3>
                  <span className='fg-chip text-[11px] font-semibold'>{traveler.matchScore}%</span>
                </div>
                <p className='fg-muted mt-1 text-sm'>{traveler.location || 'Location not set'}</p>
                <p className='fg-muted mt-2 text-xs'>
                  Style: {traveler.travelPreferences?.travelStyle || 'any'}
                </p>
                {Array.isArray(traveler.matchReasons) && (
                  <ul className='fg-muted mt-3 space-y-1 text-xs'>
                    {traveler.matchReasons.slice(0, 3).map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

export default Match;
