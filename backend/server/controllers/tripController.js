const Trip = require('../models/Trip');

const normalizeMembers = (trip) => {
  return Array.isArray(trip.members) ? trip.members : [];
};

const getEntityId = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return String(value._id);
  }

  return String(value);
};

const isTripAdmin = (trip, userId) => {
  return getEntityId(trip.createdBy) === String(userId);
};

const isTripMember = (trip, userId) => {
  return normalizeMembers(trip).some((member) => getEntityId(member) === String(userId));
};

const getViewerRole = (trip, userId) => {
  if (!userId) {
    return 'guest';
  }

  if (isTripAdmin(trip, userId)) {
    return 'admin';
  }

  if (isTripMember(trip, userId)) {
    return 'member';
  }

  return 'guest';
};

const serializeTripForUser = (trip, userId) => {
  const members = normalizeMembers(trip);
  const viewerRole = getViewerRole(trip, userId);
  const tripObject = typeof trip.toObject === 'function' ? trip.toObject() : trip;

  return {
    ...tripObject,
    joinedCount: members.length,
    viewerRole,
    canManageTrip: viewerRole === 'admin',
  };
};

const applyCoordinates = (trip, longitude, latitude) => {
  if (longitude === undefined || latitude === undefined) {
    return;
  }

  const lng = Number(longitude);
  const lat = Number(latitude);

  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return;
  }

  trip.destinationCoordinates = {
    type: 'Point',
    coordinates: [lng, lat],
  };
};

exports.createTrip = async (req, res) => {
  try {
    const { destination, date, budget, description, maxMembers, longitude, latitude } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!destination || !date) {
      return res.status(400).json({
        message: 'Destination and date are required',
      });
    }

    const parsedBudget =
      budget !== undefined && budget !== null && budget !== '' ? Number(budget) : undefined;

    if (parsedBudget !== undefined && Number.isNaN(parsedBudget)) {
      return res.status(400).json({
        message: 'Budget must be a valid number',
      });
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: 'Date must be a valid value',
      });
    }

    const parsedMaxMembers =
      maxMembers !== undefined && maxMembers !== null && maxMembers !== ''
        ? Number(maxMembers)
        : undefined;

    if (
      parsedMaxMembers !== undefined &&
      (Number.isNaN(parsedMaxMembers) || parsedMaxMembers < 1)
    ) {
      return res.status(400).json({
        message: 'Max members must be a positive number',
      });
    }

    const trip = new Trip({
      destination: destination.trim(),
      date: parsedDate,
      budget: parsedBudget,
      description: description ? description.trim() : '',
      maxMembers: parsedMaxMembers,
      createdBy: req.user.id,
      members: [req.user.id],
    });

    applyCoordinates(trip, longitude, latitude);

    await trip.save();

    res.status(201).json({
      ...serializeTripForUser(trip, req.user.id),
      message: 'Trip created. You are the trip admin.',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create trip',
    });
  }
};

exports.getTrips = async (req, res) => {
  try {
    const { search, status, minBudget, maxBudget } = req.query;
    const filter = {};

    if (search && String(search).trim()) {
      filter.destination = { $regex: String(search).trim(), $options: 'i' };
    }

    if (minBudget !== undefined && minBudget !== '') {
      filter.budget = { ...(filter.budget || {}), $gte: Number(minBudget) };
    }

    if (maxBudget !== undefined && maxBudget !== '') {
      filter.budget = { ...(filter.budget || {}), $lte: Number(maxBudget) };
    }

    const trips = await Trip.find(filter)
      .populate('createdBy', 'name location')
      .populate('members', 'name')
      .sort({ createdAt: -1 });

    let payload = trips.map((trip) => serializeTripForUser(trip, req.user.id));

    if (status === 'open' || status === 'full') {
      payload = payload.filter((trip) => {
        const count = trip.joinedCount ?? (trip.members?.length || 0);
        const isFull =
          typeof trip.maxMembers === 'number' && trip.maxMembers > 0 && count >= trip.maxMembers;
        return status === 'full' ? isFull : !isFull;
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch trips',
    });
  }
};

exports.joinTrip = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const trip = await Trip.findById(req.params.id).populate('members', 'name');

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found',
      });
    }

    const hasJoined =
      Array.isArray(trip.members) &&
      trip.members.some((member) => getEntityId(member) === req.user.id);

    if (hasJoined) {
      const payload = serializeTripForUser(trip, req.user.id);

      return res.json({
        message: 'Already joined',
        joinedCount: payload.joinedCount,
        viewerRole: payload.viewerRole,
        canManageTrip: payload.canManageTrip,
      });
    }

    // Check if trip is full (maxMembers limit reached)
    const members = normalizeMembers(trip);
    if (trip.maxMembers && members.length >= trip.maxMembers) {
      return res.status(400).json({
        message: `Trip is full. Maximum ${trip.maxMembers} members allowed`,
        joinedCount: members.length,
        maxMembers: trip.maxMembers,
        isFull: true,
      });
    }

    if (!Array.isArray(trip.members)) {
      trip.members = [];
    }

    trip.members.push(req.user.id);

    await trip.save();

    const payload = serializeTripForUser(trip, req.user.id);

    res.json({
      message: 'Joined trip',
      joinedCount: payload.joinedCount,
      viewerRole: payload.viewerRole,
      canManageTrip: payload.canManageTrip,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to join trip',
    });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name location')
      .populate('members', 'name');

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found',
      });
    }

    res.json(serializeTripForUser(trip, req.user.id));
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch trip',
    });
  }
};

exports.getTripMembers = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('members', 'name');

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found',
      });
    }

    if (!req.user || !req.user.id || !isTripAdmin(trip, req.user.id)) {
      return res.status(403).json({
        message: 'Only trip admin can access member management details',
      });
    }

    const members = normalizeMembers(trip);

    res.json({
      tripId: String(trip._id),
      members,
      count: members.length,
      viewerRole: 'admin',
      canManageTrip: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch trip members',
    });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!isTripAdmin(trip, req.user.id)) {
      return res.status(403).json({ message: 'Only trip admin can update this trip' });
    }

    const { destination, date, budget, description, maxMembers, longitude, latitude } = req.body;

    if (destination) {
      trip.destination = String(destination).trim();
    }

    if (date) {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Date must be a valid value' });
      }
      trip.date = parsedDate;
    }

    if (budget !== undefined && budget !== null && budget !== '') {
      const parsedBudget = Number(budget);
      if (Number.isNaN(parsedBudget)) {
        return res.status(400).json({ message: 'Budget must be a valid number' });
      }
      trip.budget = parsedBudget;
    }

    if (description !== undefined) {
      trip.description = description ? String(description).trim() : '';
    }

    if (maxMembers !== undefined && maxMembers !== null && maxMembers !== '') {
      const parsedMax = Number(maxMembers);
      if (Number.isNaN(parsedMax) || parsedMax < 1) {
        return res.status(400).json({ message: 'Max members must be a positive number' });
      }
      trip.maxMembers = parsedMax;
    }

    applyCoordinates(trip, longitude, latitude);

    await trip.save();

    res.json({
      message: 'Trip updated successfully',
      trip: serializeTripForUser(trip, req.user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update trip' });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!isTripAdmin(trip, req.user.id)) {
      return res.status(403).json({ message: 'Only trip admin can delete this trip' });
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete trip' });
  }
};

exports.leaveTrip = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const trip = await Trip.findById(req.params.id).populate('members', 'name');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (isTripAdmin(trip, req.user.id)) {
      return res.status(400).json({
        message: 'Trip admin cannot leave. Delete the trip instead.',
      });
    }

    if (!isTripMember(trip, req.user.id)) {
      return res.status(400).json({ message: 'You are not a member of this trip' });
    }

    trip.members = normalizeMembers(trip).filter(
      (member) => getEntityId(member) !== String(req.user.id)
    );

    await trip.save();

    const payload = serializeTripForUser(trip, req.user.id);

    res.json({
      message: 'Left trip successfully',
      joinedCount: payload.joinedCount,
      viewerRole: payload.viewerRole,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave trip' });
  }
};

exports.removeTripMember = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const trip = await Trip.findById(req.params.id).populate('members', 'name');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!isTripAdmin(trip, req.user.id)) {
      return res.status(403).json({ message: 'Only trip admin can remove members' });
    }

    const memberId = String(req.params.memberId);

    if (memberId === String(req.user.id)) {
      return res.status(400).json({
        message: 'Admin cannot remove themselves. Delete the trip instead.',
      });
    }

    trip.members = normalizeMembers(trip).filter((member) => getEntityId(member) !== memberId);

    await trip.save();

    res.json({
      message: 'Member removed',
      members: normalizeMembers(trip),
      count: trip.members.length,
      joinedCount: trip.members.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove member' });
  }
};

// Update trip destination with coordinates
exports.updateTripDestination = async (req, res) => {
  try {
    const tripId = req.params.tripId || req.params.id;
    const { destination, destinationCoordinates } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found',
      });
    }

    if (!isTripAdmin(trip, req.user.id)) {
      return res.status(403).json({
        message: 'Only trip admin can update destination',
      });
    }

    if (destination) {
      trip.destination = String(destination).trim();
    }

    if (destinationCoordinates && destinationCoordinates.coordinates) {
      const [lng, lat] = destinationCoordinates.coordinates;

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return res.status(400).json({
          message: 'Invalid coordinates: longitude must be -180 to 180, latitude must be -90 to 90',
        });
      }

      trip.destinationCoordinates = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    await trip.save();

    res.json({
      message: 'Trip destination updated successfully',
      trip: serializeTripForUser(trip, req.user.id),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update trip destination',
    });
  }
};

// Find nearby trips based on user location
exports.getNearbyTrips = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { longitude, latitude, maxDistance = 50000 } = req.query; // Default 50km

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        message: 'Longitude and latitude are required',
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        message: 'Invalid coordinates',
      });
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        message: 'Invalid coordinates: longitude must be -180 to 180, latitude must be -90 to 90',
      });
    }

    // Find trips with destination coordinates near the given location
    const nearbyTrips = await Trip.find({
      destinationCoordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .populate('createdBy', 'name location profileImage')
      .sort({ createdAt: -1 })
      .limit(20);

    const serializedTrips = nearbyTrips.map((trip) => serializeTripForUser(trip, req.user.id));

    res.json({
      searchLocation: { longitude: lng, latitude: lat },
      maxDistance: maxDistance,
      count: serializedTrips.length,
      trips: serializedTrips,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to find nearby trips',
    });
  }
};
