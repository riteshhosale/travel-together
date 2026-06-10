const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
      trim: true,
    },

    destinationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    date: {
      type: Date,
      required: true,
    },

    budget: {
      type: Number,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    maxMembers: {
      type: Number,
      min: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geospatial index for finding nearby trips
tripSchema.index({ destinationCoordinates: '2dsphere' });
tripSchema.index({ createdAt: -1 });

tripSchema.virtual('joinedCount').get(function () {
  return Array.isArray(this.members) ? this.members.length : 0;
});

module.exports = mongoose.model('Trip', tripSchema);
