import { Link } from 'react-router-dom';

function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className='fg-card border-dashed p-10 text-center'>
      <div className='fg-feature-icon mx-auto'>◎</div>
      <h3 className='fg-title mt-5 text-2xl font-bold'>{title}</h3>
      {description ? <p className='fg-muted mt-3 text-sm leading-7'>{description}</p> : null}
      {actionLabel && actionTo ? (
        <Link to={actionTo} className='fg-btn-primary mt-6 inline-flex text-sm'>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default EmptyState;
