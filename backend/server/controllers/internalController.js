const User = require('../models/User');

exports.deleteUserByEmail = async (req, res) => {
  try {
    const expected = process.env.CLEANUP_TOKEN;
    const token = req.get('x-cleanup-token');

    if (!expected || !token || token !== expected) {
      return res.status(404).json({ message: 'Not found' });
    }

    const email = req.query.email;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email query parameter required' });
    }

    const normalized = email.toLowerCase().trim();
    const removed = await User.findOneAndDelete({ email: normalized });

    if (!removed) {
      return res.json({ message: 'No user found', deleted: false });
    }

    return res.json({ message: 'User deleted', deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
