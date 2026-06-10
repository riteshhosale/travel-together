const User = require('../models/User');

exports.deleteUserByEmail = async (req, res) => {
  try {
    const token = req.get('x-cleanup-token');
    const expected = process.env.CLEANUP_TOKEN;

    if (!expected || !token || token !== expected) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter required' });
    }

    const normalized = String(email).toLowerCase().trim();

    const removed = await User.findOneAndDelete({ email: normalized });

    if (!removed) {
      return res.json({ message: 'No user found', deleted: false });
    }

    return res.json({ message: 'User deleted', deleted: true, email: normalized });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
