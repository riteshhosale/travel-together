import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';

function CreateTrip() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTrip = async () => {
    if (!destination || !date) {
      notify({ message: 'Destination and date are required.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        destination,
        date,
        budget,
        description,
        maxMembers: maxMembers ? Number(maxMembers) : undefined,
      };

      if (longitude !== '' && latitude !== '') {
        payload.longitude = Number(longitude);
        payload.latitude = Number(latitude);
      }

      await apiFetch('/trips', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      notify({ message: 'Trip created', type: 'success' });
      navigate('/trips');
    } catch (err) {
      notify({
        message: err?.message || 'Trip creation failed. Try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-page-content mx-auto w-full max-w-6xl'>
        <div className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start'>
          <section className='fg-section fg-rise'>
            <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='fg-kicker text-xs font-semibold uppercase'>New journey</p>
                <h2 className='fg-title mt-4 text-4xl font-black'>Create a trip</h2>
                <p className='fg-muted mt-3 max-w-xl text-sm leading-7 sm:text-base'>
                  Publish a trip that feels clear, structured, and credible so the right travelers
                  can understand it quickly and decide with confidence.
                </p>
              </div>
              <BackButton />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <label className='fg-muted text-xs font-semibold'>Destination</label>
                <input
                  placeholder='Lisbon, Portugal'
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>

              <div>
                <label className='fg-muted text-xs font-semibold'>Date</label>
                <input
                  type='date'
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>

              <div>
                <label className='fg-muted text-xs font-semibold'>Budget</label>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='1200'
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>

              <div>
                <label className='fg-muted text-xs font-semibold'>Max travelers</label>
                <input
                  type='number'
                  min='1'
                  step='1'
                  placeholder='10'
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  className='fg-input mt-2 text-sm'
                />
              </div>

              <div>
                <label className='fg-muted text-xs font-semibold'>Longitude (optional)</label>
                <input
                  type='number'
                  step='any'
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder='e.g. 73.85'
                  className='fg-input mt-2 text-sm'
                />
              </div>
              <div>
                <label className='fg-muted text-xs font-semibold'>Latitude (optional)</label>
                <input
                  type='number'
                  step='any'
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder='e.g. 15.49'
                  className='fg-input mt-2 text-sm'
                />
              </div>

              <div className='sm:col-span-2'>
                <label className='fg-muted text-xs font-semibold'>Description</label>
                <textarea
                  placeholder='What kind of trip is this? Share the vibe, plan, expectations, and who should join.'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='fg-input mt-2 min-h-[140px] resize-y text-sm'
                />
              </div>
            </div>

            <button
              onClick={createTrip}
              disabled={isSubmitting}
              className='fg-btn-primary mt-6 w-full text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isSubmitting ? 'Creating...' : 'Create Trip'}
            </button>
          </section>

          <aside className='space-y-6'>
            <div className='fg-card p-6'>
              <p className='fg-kicker text-xs font-semibold uppercase'>What good trips include</p>
              <div className='mt-5 space-y-4'>
                {[
                  'A clear destination and realistic date',
                  'Budget expectations so travelers self-select better',
                  'A short description of travel style and purpose',
                  'Group size limit to keep trips manageable',
                  'Trip creator becomes admin with member management access',
                ].map((item) => (
                  <div key={item} className='fg-card p-4'>
                    <p className='fg-muted text-sm'>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='fg-card p-6'>
              <p className='fg-title text-lg font-bold'>Admin access & member management</p>
              <p className='fg-muted mt-3 text-sm leading-7'>
                As the trip creator, you automatically become the trip admin. You can:
              </p>
              <ul className='fg-muted mt-3 space-y-2 text-sm leading-7'>
                <li>• View all members who have joined your trip</li>
                <li>• Set a maximum limit to control group size</li>
                <li>• Prevent new people from joining once you reach max capacity</li>
              </ul>
              <p className='fg-muted mt-4 text-sm leading-7'>
                Members can join, participate, and coordinate, but management actions remain with
                you as the admin.
              </p>
            </div>
          </aside>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default CreateTrip;
