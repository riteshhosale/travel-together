import { Link } from 'react-router-dom';

function FeatureCard({ title, description, to, actionLabel = 'Open Feature' }) {
  return (
    <article className='fg-card fg-card-hover p-6'>
      <div className='fg-feature-icon'>✦</div>
      <h3 className='fg-title mt-5 text-lg font-bold'>{title}</h3>
      <p className='fg-muted mt-3 text-sm leading-6'>{description}</p>
      {to ? (
        <Link to={to} className='fg-btn-secondary mt-5 inline-flex text-sm'>
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}

export default FeatureCard;
