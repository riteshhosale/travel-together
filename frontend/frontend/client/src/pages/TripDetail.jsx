import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';
import { getUserIdFromToken } from '../utils/userId';

function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = getUserIdFromToken();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [travelerMatches, setTravelerMatches] = useState([]);

  const isAdmin =
    trip?.canManageTrip === true ||
    trip?.viewerRole === 'admin' ||
    (trip?.createdBy && String(trip.createdBy._id || trip.createdBy) === currentUserId);

  const isMember = trip?.viewerRole === 'member' || trip?.viewerRole === 'admin';

  const loadTrip = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await apiFetch(`/trips/${id}`);
      setTrip(data);
      setForm({
        destination: data.destination || '',
        date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
        budget: data.budget ?? '',
        description: data.description || '',
        maxMembers: data.maxMembers ?? '',
        longitude: data.destinationCoordinates?.coordinates?.[0] ?? '',
        latitude: data.destinationCoordinates?.coordinates?.[1] ?? '',
      });
    } catch (err) {
      setError(err?.message || 'Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadMembers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await apiFetch(`/trips/${id}/members`);
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch {
      setMembers([]);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    if (trip && isAdmin) {
      loadMembers();
      apiFetch(`/match/trips/${id}/travelers`)
        .then((data) => setTravelerMatches(data.matches || []))
        .catch(() => setTravelerMatches([]));
    }
  }, [trip, isAdmin, loadMembers, id]);

  const saveTrip = async () => {
    try {
      const body = {
        destination: form.destination,
        date: form.date,
        budget: form.budget !== '' ? Number(form.budget) : undefined,
        description: form.description,
        maxMembers: form.maxMembers !== '' ? Number(form.maxMembers) : undefined,
      };
      if (form.longitude !== '' && form.latitude !== '') {
        body.longitude = Number(form.longitude);
        body.latitude = Number(form.latitude);
      }
      const data = await apiFetch(`/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setTrip(data.trip || data);
      setIsEditing(false);
      notify({ message: 'Trip updated', type: 'success' });
      loadTrip();
    } catch (err) {
      notify({ message: err?.message || 'Update failed', type: 'error' });
    }
  };

  const deleteTrip = async () => {
    if (!window.confirm('Delete this trip permanently?')) return;
    try {
      await apiFetch(`/trips/${id}`, { method: 'DELETE' });
      notify({ message: 'Trip deleted', type: 'success' });
      navigate('/trips');
    } catch (err) {
      notify({ message: err?.message || 'Delete failed', type: 'error' });
    }
  };

  const leaveTrip = async () => {
    try {
      await apiFetch(`/trips/leave/${id}`, { method: 'POST' });
      notify({ message: 'You left the trip', type: 'success' });
      navigate('/trips');
    } catch (err) {
      notify({ message: err?.message || 'Failed to leave', type: 'error' });
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this member from the trip?')) return;
    try {
      await apiFetch(`/trips/${id}/members/${memberId}`, { method: 'DELETE' });
      notify({ message: 'Member removed', type: 'success' });
      loadMembers();
      loadTrip();
    } catch (err) {
      notify({ message: err?.message || 'Failed to remove member', type: 'error' });
    }
  };

  const formatDate = (value) => {
    if (!value) return '--';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className='fg-page min-h-screen px-4 py-12'>
        <p className='fg-muted text-center text-sm'>Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className='fg-page min-h-screen px-4 py-12'>
        <p className='fg-alert px-4 py-3 text-sm'>{error || 'Trip not found'}</p>
        <Link to='/trips' className='fg-btn-secondary mt-4 inline-block text-sm'>
          Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className='fg-page min-h-screen px-4 py-10 sm:py-12'>
      <div className='fg-page-content mx-auto max-w-4xl fg-rise'>
        <div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
          <div>
            <p className='fg-kicker text-xs font-semibold uppercase'>Trip details</p>
            <h1 className='fg-title mt-3 text-3xl font-black'>{trip.destination}</h1>
            <p className='fg-muted mt-2 text-sm'>{formatDate(trip.date)} · {trip.budget || 'Flexible'} budget</p>
          </div>
          <BackButton />
        </div>

        {error && <div className='fg-alert mb-6 px-4 py-3 text-sm'>{error}</div>}

        {isEditing ? (
          <section className='fg-section space-y-4'>
            <input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className='fg-input text-sm'
              placeholder='Destination'
            />
            <input
              type='date'
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className='fg-input text-sm'
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className='fg-input min-h-[100px] text-sm'
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <input
                type='number'
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className='fg-input text-sm'
                placeholder='Budget'
              />
              <input
                type='number'
                value={form.maxMembers}
                onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                className='fg-input text-sm'
                placeholder='Max members'
              />
              <input
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className='fg-input text-sm'
                placeholder='Longitude'
              />
              <input
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className='fg-input text-sm'
                placeholder='Latitude'
              />
            </div>
            <div className='flex flex-wrap gap-3'>
              <button onClick={saveTrip} className='fg-btn-primary text-sm'>
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className='fg-btn-secondary text-sm'>
                Cancel
              </button>
            </div>
          </section>
        ) : (
          <section className='fg-card p-6'>
            <p className='fg-muted text-sm leading-7'>
              {trip.description || 'No description provided.'}
            </p>
            <div className='mt-4 flex flex-wrap gap-2 text-xs'>
              <span className='fg-chip'>
                Members: {trip.joinedCount ?? trip.members?.length ?? 0}
                {trip.maxMembers ? ` / ${trip.maxMembers}` : ''}
              </span>
              <span className='fg-chip'>{isAdmin ? 'You are admin' : isMember ? 'Joined' : 'Not joined'}</span>
            </div>
          </section>
        )}

        <div className='mt-6 flex flex-wrap gap-3'>
          {isMember && (
            <Link to={`/chat?tripId=${id}`} className='fg-btn-primary text-sm'>
              Open chat
            </Link>
          )}
          {isAdmin && (
            <>
              <button onClick={() => setIsEditing(true)} className='fg-btn-secondary text-sm'>
                Edit trip
              </button>
              <button onClick={deleteTrip} className='fg-btn-secondary text-sm'>
                Delete trip
              </button>
            </>
          )}
          {isMember && !isAdmin && (
            <button onClick={leaveTrip} className='fg-btn-secondary text-sm'>
              Leave trip
            </button>
          )}
          {!isMember && (
            <Link to='/trips' className='fg-btn-secondary text-sm'>
              Join from trips list
            </Link>
          )}
        </div>

        {isAdmin && travelerMatches.length > 0 && (
          <section className='fg-section mt-8'>
            <h2 className='fg-title text-lg font-bold'>Suggested travelers for this trip</h2>
            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              {travelerMatches.slice(0, 6).map((traveler) => (
                <div key={traveler._id} className='fg-card p-4'>
                  <p className='fg-title text-sm font-semibold'>{traveler.name}</p>
                  <p className='fg-muted text-xs'>{traveler.matchScore}% match</p>
                  {traveler.matchReasons?.[0] && (
                    <p className='fg-muted mt-1 text-xs'>{traveler.matchReasons[0]}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {isAdmin && members.length > 0 && (
          <section className='fg-section mt-8'>
            <h2 className='fg-title text-lg font-bold'>Members</h2>
            <ul className='mt-4 space-y-2'>
              {members.map((member) => {
                const memberId = member._id || member;
                const name = typeof member === 'object' ? member.name : member;
                return (
                  <li
                    key={memberId}
                    className='fg-card flex flex-wrap items-center justify-between gap-3 p-4'
                  >
                    <span className='fg-title text-sm font-semibold'>{name || 'Traveler'}</span>
                    {String(memberId) !== currentUserId && (
                      <button
                        onClick={() => removeMember(memberId)}
                        className='fg-btn-secondary text-xs'
                      >
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}

export default TripDetail;
