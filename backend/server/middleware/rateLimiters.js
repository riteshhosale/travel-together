const rateLimit = require('express-rate-limit');

const commonConfig = {
  standardHeaders: true,
  legacyHeaders: false,
};

const authLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: 'Too many authentication attempts. Please try again later.',
  },
});

const aiLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 1000,
  max: 12,
  message: {
    message: 'Too many AI requests. Please wait a minute and retry.',
  },
});

const globalLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
});

module.exports = {
  authLimiter,
  aiLimiter,
  globalLimiter,
};
