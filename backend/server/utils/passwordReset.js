const crypto = require('crypto');

const RESET_TOKEN_BYTES = 32;
const RESET_EXPIRY_MS = 60 * 60 * 1000;

const generateResetToken = () => crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');

const hashResetToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const getResetExpiryDate = () => new Date(Date.now() + RESET_EXPIRY_MS);

module.exports = {
  RESET_EXPIRY_MS,
  generateResetToken,
  hashResetToken,
  getResetExpiryDate,
};
