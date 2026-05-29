function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const toneClass =
    type === 'success' ? 'fg-toast-success' : type === 'error' ? 'fg-toast-error' : 'fg-toast-info';

  return (
    <div className={`fg-toast ${toneClass}`} role='status' aria-live='polite'>
      <span>{message}</span>
      <button
        type='button'
        className='fg-toast-close'
        onClick={onClose}
        aria-label='Close notification'
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
