export const NOTIFY_EVENT = 'fg:notify';

const DEFAULT_TYPE = 'info';

const normalizeDetail = (detail, fallbackType = DEFAULT_TYPE) => {
  if (typeof detail === 'string') {
    return { message: detail, type: fallbackType };
  }

  if (!detail || typeof detail !== 'object') {
    return { message: '', type: fallbackType };
  }

  return {
    ...detail,
    message: typeof detail.message === 'string' ? detail.message : '',
    type: typeof detail.type === 'string' ? detail.type : fallbackType,
  };
};

export const notify = (detail) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(NOTIFY_EVENT, {
      detail: normalizeDetail(detail),
    })
  );
};

export const notifySuccess = (message, detail = {}) => {
  notify(normalizeDetail({ ...detail, message, type: 'success' }, 'success'));
};

export const notifyError = (message, detail = {}) => {
  notify(normalizeDetail({ ...detail, message, type: 'error' }, 'error'));
};

export const notifyInfo = (message, detail = {}) => {
  notify(normalizeDetail({ ...detail, message, type: 'info' }, 'info'));
};
