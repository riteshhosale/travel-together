const router = require('express').Router();
const { deleteUserByEmail } = require('../controllers/internalController');

router.post('/delete-default-user', deleteUserByEmail);

module.exports = router;
