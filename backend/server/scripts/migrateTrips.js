const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/Database');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const migrateTrips = async () => {
  try {
    await connectDB();

    const collection = mongoose.connection.db.collection('trips');

    const result = await collection.updateMany({}, [
      {
        $set: {
          members: {
            $setUnion: [{ $ifNull: ['$members', []] }, { $ifNull: ['$joinedUsers', []] }],
          },
          date: {
            $cond: [
              { $eq: [{ $type: '$date' }, 'string'] },
              {
                $dateFromString: {
                  dateString: '$date',
                  onError: null,
                  onNull: null,
                },
              },
              '$date',
            ],
          },
        },
      },
      { $unset: 'joinedUsers' },
    ]);

    console.log('Trip migration complete:', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error('Trip migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrateTrips();
