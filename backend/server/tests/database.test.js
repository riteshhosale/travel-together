const test = require('node:test');
const assert = require('node:assert/strict');

const mongoose = require('../vendor/mongoose');

const databaseModulePath = require.resolve('../config/Database');

const loadConnectDB = () => {
  delete require.cache[databaseModulePath];
  return require('../config/Database');
};

const restoreEnvironment = (snapshot) => {
  const currentKeys = new Set(Object.keys(process.env));

  for (const key of currentKeys) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(snapshot)) {
    process.env[key] = value;
  }
};

test('connectDB retries with fallback for MongoServerSelectionError', async () => {
  const originalConnect = mongoose.connect;
  const originalReadyState = mongoose.connection.readyState;
  const envSnapshot = {
    MONGO_URI: process.env.MONGO_URI,
    MONGO_URI_FALLBACK: process.env.MONGO_URI_FALLBACK,
    MONGO_MAX_POOL_SIZE: process.env.MONGO_MAX_POOL_SIZE,
  };

  process.env.MONGO_URI = 'mongodb+srv://primary.example.com/test';
  process.env.MONGO_URI_FALLBACK = 'mongodb://fallback.example.com/test';
  process.env.MONGO_MAX_POOL_SIZE = '17';
  mongoose.connection.readyState = 0;

  const calls = [];
  mongoose.connect = async (uri, options) => {
    calls.push({ uri, options });

    if (uri === process.env.MONGO_URI) {
      const error = new Error('server selection failed');
      error.name = 'MongoServerSelectionError';
      throw error;
    }

    return mongoose.connection;
  };

  try {
    const connectDB = loadConnectDB();
    const connection = await connectDB();

    assert.equal(connection, mongoose.connection);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].uri, process.env.MONGO_URI);
    assert.equal(calls[1].uri, process.env.MONGO_URI_FALLBACK);
    assert.equal(calls[0].options.maxPoolSize, 17);
    assert.equal(calls[0].options.appName, 'travel-together-backend');
  } finally {
    mongoose.connect = originalConnect;
    mongoose.connection.readyState = originalReadyState;
    restoreEnvironment(envSnapshot);
    delete require.cache[databaseModulePath];
  }
});

test('connectDB does not retry fallback for non-network errors', async () => {
  const originalConnect = mongoose.connect;
  const originalReadyState = mongoose.connection.readyState;
  const envSnapshot = {
    MONGO_URI: process.env.MONGO_URI,
    MONGO_URI_FALLBACK: process.env.MONGO_URI_FALLBACK,
  };

  process.env.MONGO_URI = 'mongodb://primary.example.com/test';
  process.env.MONGO_URI_FALLBACK = 'mongodb://fallback.example.com/test';
  mongoose.connection.readyState = 0;

  const calls = [];
  const authError = new Error('unauthorized');
  authError.code = 13;

  mongoose.connect = async (uri, options) => {
    calls.push({ uri, options });
    throw authError;
  };

  try {
    const connectDB = loadConnectDB();

    await assert.rejects(connectDB(), (error) => error === authError);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].uri, process.env.MONGO_URI);
  } finally {
    mongoose.connect = originalConnect;
    mongoose.connection.readyState = originalReadyState;
    restoreEnvironment(envSnapshot);
    delete require.cache[databaseModulePath];
  }
});
