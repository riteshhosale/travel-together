const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../utils/emailService');
const {
  generateResetToken,
  hashResetToken,
  getResetExpiryDate,
} = require('../utils/passwordReset');

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 15);

const incrementFailedLoginAttempt = async (user) => {
  const attempts = Number(user.loginAttempts || 0) + 1;
  const updates = {
    loginAttempts: attempts,
  };

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    updates.loginAttempts = 0;
    updates.lockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
  }

  await User.updateOne({ _id: user._id }, { $set: updates });
};

const clearLoginLock = async (user) => {
  if (!user.loginAttempts && !user.lockUntil) {
    return;
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        loginAttempts: 0,
        lockUntil: null,
      },
    }
  );
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    const normalizedEmail = email ? String(email).toLowerCase().trim() : '';

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      location: location ? String(location).trim() : '',
    });

    await user.save();

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'JWT secret not configured',
      });
    }

    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? String(email).toLowerCase().trim() : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Optional debug logging to diagnose authentication issues.
    if (process.env.DEBUG_AUTH === 'true') {
      try {
        console.debug('auth: login attempt', { normalizedEmail, userFound: Boolean(user) });
      } catch (e) {
        // ignore logging errors
      }
    }

    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials',
      });
    }

    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      return res.status(423).json({
        message:
          'Account temporarily locked due to repeated failed logins. Please try again later.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (process.env.DEBUG_AUTH === 'true') {
      try {
        console.debug('auth: password check', { hasPassword: Boolean(user.password), isMatch });
      } catch (e) {
        // ignore logging errors
      }
    }

    if (!isMatch) {
      await incrementFailedLoginAttempt(user);
      return res.status(400).json({
        message: 'Invalid credentials',
      });
    }

    await clearLoginLock(user);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'JWT secret not configured',
      });
    }

    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

exports.logoutUser = async (req, res) => {
  res.json({
    message: 'Logged out',
  });
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Your session is no longer valid. Please log out and sign in again.',
        code: 'STALE_SESSION',
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load session' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const normalizedEmail = req.body.email ? String(req.body.email).toLowerCase().trim() : '';

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const resetToken = generateResetToken();
      user.resetPasswordToken = hashResetToken(resetToken);
      user.resetPasswordExpires = getResetExpiryDate();
      await user.save();

      await sendPasswordResetEmail({
        to: user.email,
        resetToken,
      });
    }

    res.json({
      message: 'If an account exists for that email, password reset instructions have been sent.',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to process password reset request',
    });
  }
};

exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({
      message: 'Password reset successful. You can log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to reset password',
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: 'Your session is no longer valid. Please log out and sign in again.',
        code: 'STALE_SESSION',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' });
  }
};
