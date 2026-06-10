const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  getMatchedTrips,
  getMatchedTravelers,
  getTripTravelerMatches,
} = require('../controllers/matchingController');

router.get('/trips', auth, getMatchedTrips);
router.get('/travelers', auth, getMatchedTravelers);
router.get('/trips/:tripId/travelers', auth, getTripTravelerMatches);

module.exports = router;
