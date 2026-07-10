import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { getNearbyTrips, getNearbyUsers, updateGpsLocation } from '../services/gps';
import { notify } from '../services/notify';
import { useSearchParams } from 'react-router-dom';

function GpsNavigator() {
  const [searchParams] = useSearchParams();
  const featureName = searchParams.get('feature') || 'GPS Navigator';
  const watchIdRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [nearbyTrips, setNearbyTrips] = useState([]);

  const hasGeolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const syncToServer = async (coords) => {
    try {
      setIsSyncing(true);
      await updateGpsLocation([coords.longitude, coords.latitude], Math.round(coords.accuracy));
      const [usersRes, tripsRes] = await Promise.all([
        getNearbyUsers(10000).catch(() => ({ users: [] })),
        getNearbyTrips(coords.longitude, coords.latitude, 100000).catch(() => ({ trips: [] })),
      ]);
      setNearbyUsers(usersRes.users || usersRes.nearbyUsers || []);
      setNearbyTrips(tripsRes.trips || []);
    } catch (err) {
      notify({ message: err?.message || 'Failed to sync location', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const onLocationSuccess = (coords, sync = true) => {
    const next = {
      lat: Number(coords.latitude.toFixed(6)),
      lng: Number(coords.longitude.toFixed(6)),
      accuracy: Math.round(coords.accuracy),
      timestamp: new Date().toLocaleTimeString(),
    };
    setPosition(next);
    if (sync) {
      syncToServer(coords);
    }
  };

  const getCurrentLocation = () => {
    if (!hasGeolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationSuccess(pos.coords);
        setIsLocating(false);
      },
      (geoError) => {
        setError(geoError.message || 'Unable to fetch location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const startTracking = () => {
    if (!hasGeolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setError('');

    if (watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        onLocationSuccess(pos.coords);
        setIsLocating(false);
      },
      (geoError) => {
        setError(geoError.message || 'Live GPS tracking failed.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const mapSrc = useMemo(() => {
    if (!position) {
      return '';
    }

    const delta = 0.02;
    const minLng = position.lng - delta;
    const minLat = position.lat - delta;
    const maxLng = position.lng + delta;
    const maxLat = position.lat + delta;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${position.lat}%2C${position.lng}`;
  }, [position]);

  return (
    <div className='fg-page min-h-screen px-4 py-10 sm:py-12'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-page-content mx-auto w-full max-w-6xl fg-rise'>
        <div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
          <div>
            <p className='fg-kicker text-xs font-semibold uppercase'>{featureName}</p>
            <h1 className='fg-title mt-3 text-3xl font-black sm:text-4xl'>{featureName}</h1>
            <p className='fg-muted mt-2 max-w-2xl text-sm sm:text-base'>
              Detect your location, sync with TravelTogether, and discover nearby travelers and
              trips.
            </p>
          </div>
          <BackButton />
        </div>

        <section className='fg-section fg-rise'>
          <div className='grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
            <div>
              <div className='flex flex-wrap gap-3'>
                <button
                  onClick={getCurrentLocation}
                  className='fg-btn-primary text-sm'
                  disabled={isLocating || isSyncing}
                >
                  {isLocating ? 'Detecting...' : 'Use My GPS'}
                </button>
                <button
                  onClick={startTracking}
                  className='fg-btn-secondary text-sm'
                  disabled={isTracking}
                >
                  Start Live Tracking
                </button>
                <button onClick={stopTracking} className='fg-btn-secondary text-sm'>
                  Stop Tracking
                </button>
              </div>

              <p className='fg-muted mt-4 text-sm'>
                {isTracking
                  ? 'Live tracking is on. Location syncs to your profile when coordinates update.'
                  : 'Enable GPS to sync your position and load nearby results.'}
                {isSyncing ? ' Syncing...' : ''}
              </p>

              {error && <div className='fg-alert mt-4 px-4 py-3 text-sm'>{error}</div>}

              {position ? (
                <div className='mt-6 grid gap-5 md:grid-cols-2'>
                  <div className='fg-card p-5'>
                    <p className='fg-title text-sm font-bold'>Current coordinates</p>
                    <p className='fg-muted mt-3 text-sm'>Latitude: {position.lat}</p>
                    <p className='fg-muted mt-1 text-sm'>Longitude: {position.lng}</p>
                    <p className='fg-muted mt-1 text-sm'>Accuracy: {position.accuracy}m</p>
                    <p className='fg-muted mt-1 text-sm'>Updated: {position.timestamp}</p>

                    <div className='mt-5 flex flex-wrap gap-3'>
                      <a
                        href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
                        target='_blank'
                        rel='noreferrer'
                        className='fg-btn-primary text-sm'
                      >
                        Open in Google Maps
                      </a>
                      <button
                        type='button'
                        onClick={() =>
                          position &&
                          syncToServer({
                            latitude: position.lat,
                            longitude: position.lng,
                            accuracy: position.accuracy,
                          })
                        }
                        className='fg-btn-secondary text-sm'
                        disabled={isSyncing}
                      >
                        Refresh nearby
                      </button>
                    </div>
                  </div>

                  <div className='fg-card p-5'>
                    <p className='fg-title text-sm font-bold'>
                      Nearby travelers ({nearbyUsers.length})
                    </p>
                    {nearbyUsers.length === 0 ? (
                      <p className='fg-muted mt-3 text-sm'>No travelers found within range yet.</p>
                    ) : (
                      <ul className='fg-muted mt-3 space-y-2 text-sm'>
                        {nearbyUsers.slice(0, 5).map((user) => (
                          <li key={user._id}>
                            {user.name || 'Traveler'}
                            {user.location ? ` · ${user.location}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className='fg-title mt-5 text-sm font-bold'>
                      Nearby trips ({nearbyTrips.length})
                    </p>
                    {nearbyTrips.length === 0 ? (
                      <p className='fg-muted mt-3 text-sm'>No trips with map coordinates nearby.</p>
                    ) : (
                      <ul className='fg-muted mt-3 space-y-2 text-sm'>
                        {nearbyTrips.slice(0, 5).map((trip) => (
                          <li key={trip._id}>
                            <Link
                              to={`/trips/${trip._id}`}
                              className='text-cyan-300 hover:underline'
                            >
                              {trip.destination}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className='fg-card mt-6 p-5'>
                  <p className='fg-title text-base font-bold'>No location detected yet</p>
                  <p className='fg-muted mt-3 text-sm'>
                    Tap <strong>Use My GPS</strong> to detect your position and sync with the
                    platform.
                  </p>
                </div>
              )}
            </div>

            <div className='fg-card overflow-hidden'>
              {mapSrc ? (
                <iframe
                  title='GPS map'
                  src={mapSrc}
                  className='h-[320px] w-full sm:h-[420px]'
                  loading='lazy'
                />
              ) : (
                <div className='flex h-[320px] items-center justify-center p-6 text-center sm:h-[420px]'>
                  <p className='fg-muted text-sm'>
                    Your live map preview will appear here after GPS detection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default GpsNavigator;
