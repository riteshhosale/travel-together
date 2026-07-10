const Trip = require('../models/Trip');
const User = require('../models/User');
const { getUserIdFromRequest, rejectStaleSession } = require('../utils/authUser');
const {
  scoreTripForUser,
  scoreTravelerForUser,
  scoreTravelerForTrip,
  sortByScoreDesc,
} = require('../utils/matching');

const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const isTripMember = (trip, userId) => {
  const members = Array.isArray(trip.members) ? trip.members : [];
  return members.some((member) => getEntityId(member) === String(userId));
};

exports.getMatchedTrips = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return rejectStaleSession(res);
    }

    const trips = await Trip.find()
      .populate('createdBy', 'name location')
      .populate('members', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    const matches = trips
      .filter((trip) => !isTripMember(trip, userId))
      .map((trip) => {
        const tripObject = typeof trip.toObject === 'function' ? trip.toObject() : trip;
        return {
          ...tripObject,
          matchScore: scoreTripForUser(user, tripObject),
          matchReasons: buildTripMatchReasons(user, tripObject),
        };
      });

    res.json({
      count: matches.length,
      matches: sortByScoreDesc(matches).slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to find matching trips' });
  }
};

exports.getMatchedTravelers = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return rejectStaleSession(res);
    }

    const candidates = await User.find({ _id: { $ne: userId } })
      .select('name email location profileImage travelPreferences createdAt')
      .limit(80);

    const matches = candidates.map((candidate) => ({
      _id: candidate._id,
      name: candidate.name,
      location: candidate.location,
      profileImage: candidate.profileImage,
      travelPreferences: candidate.travelPreferences,
      matchScore: scoreTravelerForUser(user, candidate),
      matchReasons: buildTravelerMatchReasons(user, candidate),
    }));

    res.json({
      count: matches.length,
      matches: sortByScoreDesc(matches).slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to find matching travelers' });
  }
};

exports.getTripTravelerMatches = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { tripId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const trip = await Trip.findById(tripId).populate('members', 'name');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const candidates = await User.find({
      _id: { $nin: [userId, ...trip.members.map((m) => getEntityId(m))] },
    })
      .select('name email location profileImage travelPreferences')
      .limit(80);

    const matches = candidates.map((candidate) => ({
      _id: candidate._id,
      name: candidate.name,
      location: candidate.location,
      profileImage: candidate.profileImage,
      travelPreferences: candidate.travelPreferences,
      matchScore: scoreTravelerForTrip(trip, candidate),
      matchReasons: buildTripTravelerReasons(trip, candidate),
    }));

    res.json({
      tripId: String(trip._id),
      destination: trip.destination,
      count: matches.length,
      matches: sortByScoreDesc(matches).slice(0, 15),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to find travelers for this trip' });
  }
};

function buildTripMatchReasons(user, trip) {
  const reasons = [];
  const prefs = user.travelPreferences || {};
  const destinations = [
    ...(Array.isArray(prefs.preferredDestinations) ? prefs.preferredDestinations : []),
    user.location,
  ].filter(Boolean);

  if (destinations.some((d) => trip.destination?.toLowerCase().includes(d.toLowerCase()))) {
    reasons.push('Destination aligns with your preferences');
  }

  if (trip.budget !== undefined && prefs.budgetMax) {
    reasons.push('Within your budget range');
  }

  if (trip.date && new Date(trip.date) > new Date()) {
    reasons.push('Upcoming trip dates');
  }

  return reasons.length ? reasons : ['Explore and compare with your travel style'];
}

function buildTravelerMatchReasons(viewer, candidate) {
  const reasons = [];

  if (viewer.location && candidate.location && viewer.location === candidate.location) {
    reasons.push('Same home region');
  }

  const vStyle = viewer.travelPreferences?.travelStyle;
  const cStyle = candidate.travelPreferences?.travelStyle;

  if (vStyle && cStyle && (vStyle === cStyle || vStyle === 'any' || cStyle === 'any')) {
    reasons.push('Compatible travel style');
  }

  const destinations = candidate.travelPreferences?.preferredDestinations || [];
  if (destinations.length) {
    reasons.push('Shared destination interests');
  }

  return reasons.length ? reasons : ['Potential travel companion'];
}

function buildTripTravelerReasons(trip, candidate) {
  const reasons = [];
  const destinations = candidate.travelPreferences?.preferredDestinations || [];

  if (destinations.some((d) => trip.destination?.toLowerCase().includes(String(d).toLowerCase()))) {
    reasons.push('Interested in this destination');
  }

  if (
    candidate.location &&
    trip.destination?.toLowerCase().includes(candidate.location.toLowerCase())
  ) {
    reasons.push('Based near trip region');
  }

  return reasons.length ? reasons : ['May fit this group trip'];
}
