function BackButton({ label = 'Back' }) {
  return (
    <button
      type='button'
      onClick={() => window.history.back()}
      className='fg-btn-secondary text-xs'
    >
      ← {label}
    </button>
  );
}

export default BackButton;
