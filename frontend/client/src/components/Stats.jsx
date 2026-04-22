import { useEffect, useState } from 'react';
import { apiFetch } from '../services/apiFetch';

function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/stats');
        setStats(data);
      } catch {
        setStats(null);
      }
    };

    load();
  }, []);

  const items = stats
    ? [
        {
          label: 'Trips created',
          value: `${stats.tripsCreated}`,
          hint: 'Published journeys on the platform',
        },
        {
          label: 'Traveler rating',
          value: stats.averageRating ? `${stats.averageRating}/5` : '—',
          hint: `${stats.reviews} reviews from the community`,
        },
        {
          label: 'Active travelers',
          value: `${stats.travelers}`,
          hint: 'Registered accounts exploring together',
        },
      ]
    : [
        {
          label: 'Trips created',
          value: '—',
          hint: 'Connect to the API for live stats',
        },
        {
          label: 'Traveler rating',
          value: '—',
          hint: 'Community reviews',
        },
        {
          label: 'Active travelers',
          value: '—',
          hint: 'Registered users',
        },
      ];

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {items.map((item) => (
        <div key={item.label} className='fg-card fg-card-hover px-6 py-6'>
          <p className='fg-muted text-xs uppercase tracking-[0.22em]'>{item.label}</p>
          <p className='fg-title mt-4 text-3xl font-black'>{item.value}</p>
          <p className='fg-muted mt-3 text-sm'>{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

export default Stats;
