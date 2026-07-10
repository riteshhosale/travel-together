const mongoose = require('mongoose');

const STALE_SESSION_MESSAGE = 'Your session is no longer valid. Please log out and sign in again.';

const getUserIdFromRequest = (req) => {
  if (!req.user) {
    return '';
  }

  const raw = req.user.id || req.user._id || req.user.userId;

  if (!raw) {
    return '';
  }

  return String(raw);
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const rejectStaleSession = (res) =>
  res.status(401).json({
    message: STALE_SESSION_MESSAGE,
    code: 'STALE_SESSION',
  });

module.exports = {
  STALE_SESSION_MESSAGE,
  getUserIdFromRequest,
  isValidObjectId,
  rejectStaleSession,
};
