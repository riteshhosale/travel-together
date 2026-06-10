const Review = require('../models/Review');
const Trip = require('../models/Trip');

exports.createReview = async (req, res) => {
  try {
    const { tripId, rating, comment } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!tripId) {
      return res.status(400).json({
        message: 'Trip is required',
      });
    }

    const numericRating = Number(rating);

    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5',
      });
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found',
      });
    }

    const review = new Review({
      tripId,
      userId: req.user.id,
      rating: numericRating,
      comment: comment ? String(comment).trim() : '',
    });

    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create review',
    });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      tripId: req.params.tripId,
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch reviews',
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (String(review.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    const { rating, comment } = req.body;

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      review.rating = numericRating;
    }

    if (comment !== undefined) {
      review.comment = comment ? String(comment).trim() : '';
    }

    await review.save();
    await review.populate('userId', 'name');

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (String(review.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review' });
  }
};
