const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('../utils/authUser');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({
      message: 'No token provided',
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: 'JWT secret not configured',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    req.user = {
      ...decoded,
      id: String(userId),
    };

    next();
  } catch (err) {
    res.status(401).json({
      message: 'Invalid token',
    });
  }
};
