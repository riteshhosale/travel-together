const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validate');
const {
  createTripSchema,
  updateTripSchema,
  updateTripDestinationSchema,
} = require('../validators/requestSchemas');

const {
  createTrip,
  getTrips,
  getTripById,
  getTripMembers,
  joinTrip,
  leaveTrip,
  removeTripMember,
  updateTrip,
  deleteTrip,
  updateTripDestination,
  getNearbyTrips,
} = require('../controllers/tripController');

router.get('/search/nearby', authMiddleware, getNearbyTrips);
router.post('/', authMiddleware, validateBody(createTripSchema), createTrip);
router.get('/', authMiddleware, getTrips);
router.post('/join/:id', authMiddleware, joinTrip);
router.post('/leave/:id', authMiddleware, leaveTrip);
router.get('/:id/members', authMiddleware, getTripMembers);
router.delete('/:id/members/:memberId', authMiddleware, removeTripMember);
router.put('/:id', authMiddleware, validateBody(updateTripSchema), updateTrip);
router.delete('/:id', authMiddleware, deleteTrip);
router.put(
  '/:id/destination',
  authMiddleware,
  validateBody(updateTripDestinationSchema),
  updateTripDestination
);
router.get('/:id', authMiddleware, getTripById);

module.exports = router;
