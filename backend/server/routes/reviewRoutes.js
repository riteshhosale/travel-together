const router = require('express').Router();

const auth = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validate');
const { createReviewSchema, updateReviewSchema } = require('../validators/requestSchemas');

const { createReview, getReviews, updateReview, deleteReview } = require('../controllers/reviewController');

router.post('/', auth, validateBody(createReviewSchema), createReview);

router.put('/:id', auth, validateBody(updateReviewSchema), updateReview);

router.delete('/:id', auth, deleteReview);

router.get('/:tripId', getReviews);

module.exports = router;
