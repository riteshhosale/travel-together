const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');
const { validateBody } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/requestSchemas');

const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  changePassword,
  requestPasswordReset,
  resetPasswordWithToken,
} = require('../controllers/authController');

router.post('/register', authLimiter, validateBody(registerSchema), registerUser);
router.post('/login', authLimiter, validateBody(loginSchema), loginUser);
router.post('/logout', logoutUser);
router.get('/me', auth, getMe);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), requestPasswordReset);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPasswordWithToken);
router.post('/change-password', auth, authLimiter, validateBody(changePasswordSchema), changePassword);

module.exports = router;
