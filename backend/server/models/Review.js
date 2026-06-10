const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

reviewSchema.index({ tripId: 1, createdAt: -1 });
reviewSchema.index({ tripId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
