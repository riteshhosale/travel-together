const router = require('express').Router();

const authMiddleware = require('../middleware/authMiddleware');
const { getTripMessages, createTripMessage } = require('../controllers/messageController');

router.get('/:tripId', authMiddleware, getTripMessages);
router.post('/', authMiddleware, createTripMessage);

module.exports = router;
