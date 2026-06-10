/**
 * Migration script to add geospatial indexes to User and Trip collections
 * Run this after deploying the updated models with GeoJSON fields
 *
 * Usage: node server/scripts/migrateGeospatialIndexes.js (from backend directory)
 *        or: node backend/server/scripts/migrateGeospatialIndexes.js (from root directory)
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');
const Trip = require('../models/Trip');

async function migrateGeospatialIndexes() {
  try {
    // Connect to MongoDB
    let mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;

    // Check if MONGO_URI is valid, otherwise use fallback
    if (mongoUri && !mongoUri.startsWith('mongodb')) {
      console.log('⚠️  MONGO_URI is invalid, using MONGO_URI_FALLBACK instead');
      mongoUri = process.env.MONGO_URI_FALLBACK;
    }

    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGO_URI_FALLBACK not set in environment variables');
    }

    await mongoose.connect(mongoUri);

    console.log('Connected to MongoDB');

    // Create geospatial indexes for User collection
    console.log('Creating geospatial indexes for User collection...');

    await User.collection.createIndex({ currentLocation: '2dsphere' });
    console.log('✓ Created 2dsphere index on User.currentLocation');

    await User.collection.createIndex({ 'locationHistory.timestamp': -1 });
    console.log('✓ Created index on User.locationHistory.timestamp');

    // Create geospatial indexes for Trip collection
    console.log('\nCreating geospatial indexes for Trip collection...');

    await Trip.collection.createIndex({ destinationCoordinates: '2dsphere' });
    console.log('✓ Created 2dsphere index on Trip.destinationCoordinates');

    await Trip.collection.createIndex({ createdAt: -1 });
    console.log('✓ Created index on Trip.createdAt');

    // Initialize existing documents with default location values (if needed)
    console.log('\nInitializing location fields...');

    const usersWithoutLocation = await User.countDocuments({
      currentLocation: { $exists: false },
    });

    if (usersWithoutLocation > 0) {
      await User.updateMany(
        { currentLocation: { $exists: false } },
        {
          $set: {
            currentLocation: {
              type: 'Point',
              coordinates: [0, 0],
            },
            locationHistory: [],
          },
        }
      );
      console.log(`✓ Initialized ${usersWithoutLocation} user documents with default location`);
    }

    const tripsWithoutDestinationCoordinates = await Trip.countDocuments({
      destinationCoordinates: { $exists: false },
    });

    if (tripsWithoutDestinationCoordinates > 0) {
      await Trip.updateMany(
        { destinationCoordinates: { $exists: false } },
        {
          $set: {
            destinationCoordinates: {
              type: 'Point',
              coordinates: [0, 0],
            },
          },
        }
      );
      console.log(
        `✓ Initialized ${tripsWithoutDestinationCoordinates} trip documents with default destination coordinates`
      );
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nGeospatial features are now ready:');
    console.log('- User GPS tracking via POST /api/user/gps/update');
    console.log('- Location history via GET /api/user/gps/history');
    console.log('- Nearby users via GET /api/user/gps/nearby');
    console.log('- Update trip destination via PUT /api/trip/:tripId/destination');
    console.log('- Find nearby trips via GET /api/trip/search/nearby');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run migration
migrateGeospatialIndexes();
