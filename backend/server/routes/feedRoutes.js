const router = require('express').Router();

const auth = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

const { createPost, getFeed, deletePost } = require('../controllers/feedController');

router.post('/', auth, uploadImage.single('imageFile'), createPost);

router.get('/', getFeed);

router.delete('/:id', auth, deletePost);

module.exports = router;
