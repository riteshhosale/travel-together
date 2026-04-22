import { useCallback, useEffect, useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import Footer from '../components/Footer';
import SectionHeader from '../components/SectionHeader';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';
import { getUserIdFromToken } from '../utils/userId';

const renderStars = (value) =>
  Array.from({ length: 5 }, (_, index) => (index < value ? '★' : '☆')).join('');

function Reviews() {
  const currentUserId = getUserIdFromToken();
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTripDate = useCallback((value) => {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString();
  }, []);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setIsLoadingTrips(true);
        setError('');
        const data = await apiFetch('/trips');
        setTrips(data);
      } catch (err) {
        setError(err?.message || 'Failed to load trips');
      } finally {
        setIsLoadingTrips(false);
      }
    };

    loadTrips();
  }, []);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip._id === tripId) || null,
    [trips, tripId]
  );

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const loadReviews = async (selectedTripId = tripId) => {
    if (!selectedTripId) {
      notify({ message: 'Choose a trip first.', type: 'error' });
      return;
    }

    try {
      setIsLoadingReviews(true);
      setError('');
      const data = await apiFetch(`/reviews/${selectedTripId}`);
      setReviews(data);
    } catch (err) {
      setError(err?.message || 'Failed to load reviews');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const createReview = async () => {
    if (!tripId) {
      notify({ message: 'Choose a trip first.', type: 'error' });
      return;
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      notify({ message: 'Rating must be between 1 and 5.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({ tripId, rating: Number(rating), comment }),
      });
      setComment('');
      setRating(5);
      await loadReviews(tripId);
      notify({ message: 'Review added successfully.', type: 'success' });
    } catch (err) {
      notify({ message: err?.message || 'Failed to add review', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-page-content mx-auto w-full max-w-5xl fg-rise'>
        <div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
          <SectionHeader
            kicker='Reviews'
            title='Trip feedback'
            subtitle='See what travelers think, track ratings, and leave useful reviews.'
          />
          <BackButton />
        </div>

        <div className='grid gap-6 lg:grid-cols-[1.15fr_0.85fr]'>
          <div className='fg-section fg-rise'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <label className='fg-muted text-xs font-semibold'>Select a trip</label>
                <select
                  value={tripId}
                  onChange={(e) => {
                    const nextTripId = e.target.value;
                    setTripId(nextTripId);
                    setReviews([]);
                    if (nextTripId) {
                      loadReviews(nextTripId);
                    }
                  }}
                  className='fg-input mt-2 text-sm'
                >
                  <option value=''>Choose trip</option>
                  {trips.map((trip) => (
                    <option key={trip._id} value={trip._id}>
                      {trip.destination} ({trip.date})
                    </option>
                  ))}
                </select>
                {isLoadingTrips && <p className='fg-muted mt-2 text-xs'>Loading trips...</p>}
              </div>

              <div>
                <label className='fg-muted text-xs font-semibold'>Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className='fg-input mt-2 text-sm'
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <p className='mt-2 text-lg text-cyan-300'>{renderStars(Number(rating))}</p>
              </div>

              <div>
                <label className='fg-muted text-xs font-semibold'>Quick action</label>
                <button
                  onClick={() => loadReviews()}
                  className='fg-btn-secondary mt-2 w-full text-sm transition hover:border-cyan-300 hover:text-cyan-300'
                >
                  Refresh reviews
                </button>
              </div>

              <div className='sm:col-span-2'>
                <label className='fg-muted text-xs font-semibold'>Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder='Share your experience, tips, or anything future travelers should know'
                  className='fg-input mt-2 min-h-[120px] resize-y text-sm'
                />
              </div>
            </div>

            <div className='mt-4 flex flex-wrap gap-3'>
              <button
                onClick={createReview}
                disabled={isSubmitting}
                className='fg-btn-primary text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {isSubmitting ? 'Posting...' : 'Add review'}
              </button>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='fg-card p-6'>
              <p className='fg-kicker text-xs font-semibold uppercase'>Trip overview</p>
              {selectedTrip ? (
                <>
                  <h3 className='fg-title mt-3 text-2xl font-semibold'>
                    {selectedTrip.destination}
                  </h3>
                  <div className='mt-4 flex flex-wrap gap-2 text-xs font-semibold'>
                    <span className='fg-chip'>Date: {formatTripDate(selectedTrip.date)}</span>
                    <span className='fg-chip'>Budget: {selectedTrip.budget || 'Flexible'}</span>
                    <span className='fg-chip'>
                      Travelers: {selectedTrip.joinedCount || selectedTrip.members?.length || 0}
                    </span>
                  </div>
                  <p className='fg-muted mt-4 text-sm'>
                    {selectedTrip.description || 'No description added yet for this trip.'}
                  </p>
                </>
              ) : (
                <p className='fg-muted text-sm'>Pick a trip to view ratings and feedback.</p>
              )}
            </div>

            <div className='fg-card p-6'>
              <p className='fg-kicker text-xs font-semibold uppercase'>Ratings snapshot</p>
              <div className='mt-4 flex items-end justify-between gap-4'>
                <div>
                  <h3 className='fg-title text-4xl font-bold'>
                    {averageRating ? averageRating.toFixed(1) : '0.0'}
                  </h3>
                  <p className='mt-2 text-lg text-cyan-300'>
                    {renderStars(Math.round(averageRating || 0))}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='fg-muted text-xs font-semibold uppercase tracking-[0.2em]'>
                    Reviews
                  </p>
                  <p className='fg-title mt-2 text-2xl font-semibold'>{reviews.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className='fg-alert mt-6 px-4 py-3 text-sm'>{error}</div>}

        <div className='mt-8 space-y-4'>
          {isLoadingReviews ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {[...Array(2)].map((_, index) => (
                <div key={`review-loading-${index}`} className='fg-card p-6'>
                  <div className='h-4 w-32 rounded-full bg-slate-800/70' />
                  <div className='mt-4 h-4 w-full rounded-full bg-slate-800/70' />
                  <div className='mt-2 h-4 w-4/5 rounded-full bg-slate-800/70' />
                </div>
              ))}
            </div>
          ) : !tripId ? (
            <EmptyState
              title='Select a trip'
              description='Choose a trip above to see reviews and leave your own feedback.'
            />
          ) : reviews.length === 0 ? (
            <EmptyState
              title='No reviews yet'
              description='Be the first traveler to share useful feedback for this trip.'
            />
          ) : (
            <div className='grid gap-4 md:grid-cols-2'>
              {reviews.map((review) => (
                <div key={review._id} className='fg-card p-6'>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <p className='fg-title text-sm font-semibold'>
                        {review.userId?.name || 'Traveler'}
                      </p>
                      <p className='mt-2 text-lg text-cyan-300'>
                        {renderStars(Number(review.rating || 0))}
                      </p>
                    </div>
                    <span className='fg-chip text-[11px] font-semibold uppercase tracking-wide'>
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString()
                        : `${review.rating}/5`}
                    </span>
                  </div>
                  <p className='fg-muted mt-4 text-sm'>
                    {review.comment || 'No comment provided.'}
                  </p>
                  {review.userId?._id && String(review.userId._id) === currentUserId && (
                    <div className='mt-4 flex flex-wrap gap-2'>
                      <button
                        type='button'
                        className='fg-btn-secondary text-xs'
                        onClick={async () => {
                          const nextRating = window.prompt('New rating (1-5)', String(review.rating));
                          if (!nextRating) return;
                          try {
                            await apiFetch(`/reviews/${review._id}`, {
                              method: 'PUT',
                              body: JSON.stringify({ rating: Number(nextRating) }),
                            });
                            await loadReviews(tripId);
                            notify({ message: 'Review updated', type: 'success' });
                          } catch (err) {
                            notify({ message: err?.message || 'Update failed', type: 'error' });
                          }
                        }}
                      >
                        Edit rating
                      </button>
                      <button
                        type='button'
                        className='fg-btn-secondary text-xs'
                        onClick={async () => {
                          if (!window.confirm('Delete your review?')) return;
                          try {
                            await apiFetch(`/reviews/${review._id}`, { method: 'DELETE' });
                            await loadReviews(tripId);
                            notify({ message: 'Review deleted', type: 'success' });
                          } catch (err) {
                            notify({ message: err?.message || 'Delete failed', type: 'error' });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Reviews;
