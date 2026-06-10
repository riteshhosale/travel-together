const Trip = require('../models/Trip');
const User = require('../models/User');
const Review = require('../models/Review');
const Feed = require('../models/Feed');

exports.getPublicStats = async (req, res) => {
  try {
    const [tripCount, userCount, reviewCount, feedCount, ratingAgg] = await Promise.all([
      Trip.countDocuments(),
      User.countDocuments(),
      Review.countDocuments(),
      Feed.countDocuments(),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    ]);

    const avgRating = ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(1)) : 0;
    const ratedCount = ratingAgg[0]?.count || 0;

    res.json({
      tripsCreated: tripCount,
      travelers: userCount,
      reviews: reviewCount,
      feedPosts: feedCount,
      averageRating: avgRating,
      ratedTrips: ratedCount,
      aiAssists: tripCount + reviewCount,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch stats',
    });
  }
};
