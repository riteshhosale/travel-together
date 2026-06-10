const mongoose = require('mongoose');

const Message = require('../models/Message');
const Trip = require('../models/Trip');

exports.getTripMessages = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    const { tripId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        message: 'Invalid trip id',
      });
    }

    const trip = await Trip.findOne({ _id: tripId, members: userId }).select('_id');

    if (!trip) {
      return res.status(403).json({
        message: 'You must join the trip to view chat',
      });
    }

    const messages = await Message.find({ tripId })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch messages',
    });
  }
};

exports.createTripMessage = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    const { tripId, text } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        message: 'Invalid trip id',
      });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        message: 'Message text is required',
      });
    }

    const trip = await Trip.findOne({ _id: tripId, members: userId }).select('_id');

    if (!trip) {
      return res.status(403).json({
        message: 'You must join the trip to send messages',
      });
    }

    const message = await Message.create({
      tripId,
      senderId: userId,
      text: String(text).trim(),
    });

    const populatedMessage = await message.populate('senderId', 'name');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send message',
    });
  }
};
