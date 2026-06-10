const router = require('express').Router();
const { getPublicStats } = require('../controllers/statsController');

router.get('/', getPublicStats);

module.exports = router;
