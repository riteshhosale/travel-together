const router = require('express').Router();

const auth = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { validateBody } = require('../middleware/validate');
const { updateGpsSchema, updateMatchPreferencesSchema } = require('../validators/requestSchemas');

const {
  getProfile,
  updateProfile,
  updateMatchPreferences,
  updateGpsLocation,
  getLocationHistory,
  getNearbyUsers,
} = require('../controllers/userController');

router.get('/profile', auth, getProfile);

router.put('/profile', auth, uploadImage.single('imageFile'), updateProfile);

router.put(
  '/match-preferences',
  auth,
  validateBody(updateMatchPreferencesSchema),
  updateMatchPreferences
);

// GPS Tracking endpoints
router.post('/gps/update', auth, validateBody(updateGpsSchema), updateGpsLocation);

router.get('/gps/history', auth, getLocationHistory);

router.get('/gps/nearby', auth, getNearbyUsers);

module.exports = router;
