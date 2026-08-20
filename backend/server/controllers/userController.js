const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { deleteStoredImageByUrl, getUploadedImageValue } = require('../utils/imageStorage');
const { getUserIdFromRequest, rejectStaleSession } = require('../utils/authUser');

// GPS Tracking: Update user's current location
exports.updateGpsLocation = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { coordinates, accuracy } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        message: 'Invalid coordinates format. Expected [longitude, latitude]',
      });
    }

    const [lng, lat] = coordinates;

    // Validate coordinate ranges
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        message: 'Invalid coordinates: longitude must be -180 to 180, latitude must be -90 to 90',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return rejectStaleSession(res);
    }

    // Update current location
    user.currentLocation = {
      type: 'Point',
      coordinates: [lng, lat],
    };

    // Add to location history (keep last 100 entries)
    user.locationHistory.push({
      coordinates: [lng, lat],
      timestamp: new Date(),
      accuracy: accuracy || undefined,
    });

    // Keep only last 100 location history entries
    if (user.locationHistory.length > 100) {
      user.locationHistory = user.locationHistory.slice(-100);
    }

    await user.save();

    res.json({
      message: 'Location updated successfully',
      currentLocation: user.currentLocation,
      lastUpdated: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update location',
    });
  }
};

// Get user's location history
exports.getLocationHistory = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId).select('locationHistory currentLocation');

    if (!user) {
      return rejectStaleSession(res);
    }

    res.json({
      currentLocation: user.currentLocation,
      history: user.locationHistory,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch location history',
    });
  }
};

// Get nearby users within a certain distance
exports.getNearbyUsers = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { maxDistance = 5000 } = req.query; // Default 5km in meters

    const user = await User.findById(userId);

    if (!user) {
      return rejectStaleSession(res);
    }

    if (!user.currentLocation || !user.currentLocation.coordinates) {
      return res.status(400).json({
        message: "User's location not set. Enable GPS tracking first.",
      });
    }

    // Find users within maxDistance meters
    const nearbyUsers = await User.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.currentLocation.coordinates,
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
      _id: { $ne: userId }, // Exclude self
    }).select('name location currentLocation profileImage');

    res.json({
      distance: maxDistance,
      count: nearbyUsers.length,
      users: nearbyUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to find nearby users',
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return rejectStaleSession(res);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to load profile',
    });
  }
};

exports.updateMatchPreferences = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return rejectStaleSession(res);
    }

    const {
      preferredDestinations,
      preferredDestination,
      budgetMin,
      budgetMax,
      preferredBudget,
      travelStyle,
      bio,
    } = req.body;

    if (!user.travelPreferences) {
      user.travelPreferences = {};
    }

    if (Array.isArray(preferredDestinations)) {
      user.travelPreferences.preferredDestinations = preferredDestinations;
    } else if (preferredDestination) {
      const existing = user.travelPreferences.preferredDestinations || [];
      const next = preferredDestination.trim();
      if (next && !existing.includes(next)) {
        user.travelPreferences.preferredDestinations = [...existing, next].slice(0, 10);
      }
    }

    if (budgetMin !== undefined) {
      user.travelPreferences.budgetMin = budgetMin;
    }

    if (budgetMax !== undefined) {
      user.travelPreferences.budgetMax = budgetMax;
    }

    if (preferredBudget !== undefined && budgetMax === undefined) {
      user.travelPreferences.budgetMax = preferredBudget;
    }

    if (travelStyle) {
      user.travelPreferences.travelStyle = travelStyle;
    }

    if (bio !== undefined) {
      user.travelPreferences.bio = String(bio).trim();
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      message: 'Match preferences updated',
      travelPreferences: updatedUser.travelPreferences,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update match preferences' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { name, email, password, location } = req.body || {};

    const removeAvatar = req.body?.removeAvatar === 'true';

    const user = await User.findById(userId);

    if (!user) {
      return rejectStaleSession(res);
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

      if (existingUser) {
        return res.status(400).json({
          message: 'Email already exists',
        });
      }

      user.email = email.toLowerCase().trim();
    }

    if (name !== undefined) {
      user.name = String(name).trim();
    }

    if (location !== undefined) {
      user.location = String(location).trim();
    }

    if (removeAvatar && user.profileImage) {
      await deleteStoredImageByUrl(user.profileImage);
      user.profileImage = '';
    }

    if (req.file) {
      if (user.profileImage) {
        await deleteStoredImageByUrl(user.profileImage);
      }

      user.profileImage = getUploadedImageValue({ file: req.file, req, mode: 'relative' });
    }

    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters',
        });
      }

      user.password = await bcrypt.hash(String(password), 10);
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update profile',
    });
  }
};
