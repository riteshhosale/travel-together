const mongoose = require('mongoose');

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getConnectionOptions = () => ({
  appName: 'travel-together-backend',
  connectTimeoutMS: toPositiveInteger(process.env.MONGO_CONNECT_TIMEOUT_MS, 10000),
  maxPoolSize: toPositiveInteger(process.env.MONGO_MAX_POOL_SIZE, 10),
  minPoolSize: toPositiveInteger(process.env.MONGO_MIN_POOL_SIZE, 0),
  retryWrites: process.env.MONGO_RETRY_WRITES !== 'false',
  serverSelectionTimeoutMS: toPositiveInteger(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10000),
  socketTimeoutMS: toPositiveInteger(process.env.MONGO_SOCKET_TIMEOUT_MS, 45000),
});

let connectPromise = null;

const redactMongoUri = (uri) => {
  if (!uri) {
    return '';
  }

  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname || ''}`;
  } catch (error) {
    return '';
  }
};

const shouldUseFallbackUri = (error) => {
  if (!error) {
    return false;
  }

  const message = String(error.message || '');
  const code = String(error.code || '');
  const name = String(error.name || '');

  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('EAI_AGAIN') ||
    message.includes('ETIMEDOUT') ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    code === 'ETIMEDOUT' ||
    name === 'MongoServerSelectionError'
  );
};

const connectWithUri = async (uri) => {
  await mongoose.connect(uri, getConnectionOptions());
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_FALLBACK;

  if (!primaryUri) {
    throw new Error('MONGO_URI is not set');
  }

  connectPromise = (async () => {
    try {
      await connectWithUri(primaryUri);
      console.log(`MongoDB Connected (${redactMongoUri(primaryUri)})`);
      return mongoose.connection;
    } catch (error) {
      if (!fallbackUri || !shouldUseFallbackUri(error)) {
        if (!fallbackUri && shouldUseFallbackUri(error)) {
          console.error(
            'SRV lookup failed. Set MONGO_URI_FALLBACK with a standard (non-SRV) Atlas URI.'
          );
        }

        throw error;
      }

      console.warn(
        `Primary MongoDB URI failed (${redactMongoUri(primaryUri)}); retrying with fallback.`
      );

      try {
        await connectWithUri(fallbackUri);
        console.log(`MongoDB Connected (${redactMongoUri(fallbackUri)})`);
        return mongoose.connection;
      } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
      } finally {
        connectPromise = null;
      }
    }
  })();

  return connectPromise;
};

const closeDB = async () => {
  if (connectPromise) {
    try {
      await connectPromise;
    } catch (error) {
      // Ignore startup errors during shutdown.
    }
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = connectDB;
module.exports.closeDB = closeDB;
