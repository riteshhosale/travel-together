const path = require('path');
const mongoose = require('../vendor/mongoose');
const connectDB = require('../config/Database');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch (error) {
  // The test environment does not need dotenv; fall back to process.env.
}

const validators = [
  {
    name: 'users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { bsonType: 'string', minLength: 1 },
          email: { bsonType: 'string', minLength: 3 },
          password: { bsonType: 'string', minLength: 6 },
          location: { bsonType: 'string' },
          profileImage: { bsonType: 'string' },
        },
      },
    },
  },
  {
    name: 'trips',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['destination', 'date', 'createdBy', 'members'],
        properties: {
          destination: { bsonType: 'string', minLength: 1 },
          date: { bsonType: 'date' },
          budget: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0 },
          description: { bsonType: 'string' },
          maxMembers: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 1 },
          createdBy: { bsonType: 'objectId' },
          members: {
            bsonType: 'array',
            items: { bsonType: 'objectId' },
          },
        },
      },
    },
  },
  {
    name: 'reviews',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['tripId', 'userId', 'rating'],
        properties: {
          tripId: { bsonType: 'objectId' },
          userId: { bsonType: 'objectId' },
          rating: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 1, maximum: 5 },
          comment: { bsonType: 'string' },
        },
      },
    },
  },
  {
    name: 'feeds',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user'],
        properties: {
          user: { bsonType: 'objectId' },
          image: { bsonType: 'string' },
          caption: { bsonType: 'string' },
          createdAt: { bsonType: 'date' },
        },
      },
    },
  },
  {
    name: 'messages',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['tripId', 'senderId', 'text'],
        properties: {
          tripId: { bsonType: 'objectId' },
          senderId: { bsonType: 'objectId' },
          text: { bsonType: 'string', minLength: 1 },
          createdAt: { bsonType: 'date' },
        },
      },
    },
  },
];

const isCollModUnauthorizedError = (error) => {
  if (!error) {
    return false;
  }

  const message = String(error.message || '');
  return (
    error.code === 13 ||
    message.includes('not allowed to do action [collMod]') ||
    message.toLowerCase().includes('unauthorized')
  );
};

const applyValidators = async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const dbName = (db && db.databaseName) || 'unknown';
    const failedCollections = [];

    if (dbName === 'test') {
      console.warn(
        "Connected to database 'test'. If this is not intended, include your app DB name in MONGO_URI/MONGO_URI_FALLBACK."
      );
    }

    for (const item of validators) {
      try {
        await db.command({
          collMod: item.name,
          validator: item.validator,
          validationLevel: 'moderate',
          validationAction: 'error',
        });
        console.log(`Validator applied to ${item.name}`);
      } catch (error) {
        failedCollections.push({
          name: item.name,
          unauthorized: isCollModUnauthorizedError(error),
          message: error.message,
        });
        console.error(`Failed to apply validator to ${item.name}:`, error.message);
      }
    }

    if (failedCollections.length > 0) {
      process.exitCode = 1;

      const permissionErrors = failedCollections.filter((item) => item.unauthorized);

      if (permissionErrors.length > 0) {
        console.error(
          'Validator setup needs higher MongoDB permissions: grant a role with collMod (for example dbOwner) on your target DB.'
        );
      }

      console.error(
        `Validator summary: ${validators.length - failedCollections.length}/${validators.length} applied on database '${dbName}'.`
      );
    }

    await db.collection('reviews').createIndex({ tripId: 1, userId: 1 }, { unique: true });
    console.log('Review unique index ensured (tripId + userId)');
  } catch (error) {
    console.error('Validator setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  applyValidators();
}

module.exports = {
  applyValidators,
  validators,
};
