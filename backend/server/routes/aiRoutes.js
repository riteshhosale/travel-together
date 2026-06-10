const router = require('express').Router();

const { tripPlan, luggage, chat } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/trip-plan', tripPlan);

router.post('/luggage', luggage);

router.post('/chat', chat);

module.exports = router;
