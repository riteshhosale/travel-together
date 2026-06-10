const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] - GeoJSON standard
        default: [0, 0],
      },
    },

    locationHistory: [
      {
        coordinates: {
          type: [Number],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        accuracy: Number,
      },
    ],

    profileImage: {
      type: String,
      trim: true,
      default: '',
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    travelPreferences: {
      preferredDestinations: {
        type: [String],
        default: [],
      },
      budgetMin: {
        type: Number,
        min: 0,
      },
      budgetMax: {
        type: Number,
        min: 0,
      },
      travelStyle: {
        type: String,
        enum: ['relaxed', 'adventure', 'cultural', 'any'],
        default: 'any',
      },
      bio: {
        type: String,
        trim: true,
        default: '',
        maxlength: 500,
      },
    },
  },
  { timestamps: true }
);

// Geospatial index for proximity queries
userSchema.index({ currentLocation: '2dsphere' });
// Index for location history queries
userSchema.index({ 'locationHistory.timestamp': -1 });

module.exports = mongoose.model('User', userSchema);
