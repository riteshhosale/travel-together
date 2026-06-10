const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  image: {
    type: String,
    trim: true,
    default: '',
  },

  caption: {
    type: String,
    trim: true,
    default: '',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

feedSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feed', feedSchema);
