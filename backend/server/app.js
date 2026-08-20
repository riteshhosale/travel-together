require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Initialize Sentry early to capture startup errors
const Sentry = require('@sentry/node');
try {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    tracesSampleRate: 0.0,
    environment: process.env.NODE_ENV || 'development',
  });
} catch (e) {
  // ignore if Sentry not configured
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const client = require('prom-client');

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/Database');
const Message = require('./models/Message');
const Trip = require('./models/Trip');
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const feedRoutes = require('./routes/feedRoutes');
const aiRoutes = require('./routes/aiRoutes');
const messageRoutes = require('./routes/messageRoutes');
const statsRoutes = require('./routes/statsRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const internalRoutes = require('./routes/internalRoutes');
const { aiLimiter, globalLimiter } = require('./middleware/rateLimiters');
const mongoSanitize = require('express-mongo-sanitize');
const xssFilters = require('xss-filters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const closeDB = connectDB.closeDB;
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://travel-together-neon.vercel.app',
];

const configuredOrigins = `${process.env.CLIENT_URL || ''},${process.env.CLIENT_URLS || ''}`
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

const isVercelPreviewOrigin = (origin) => {
  return (
    /^https:\/\/travel-together-frontend(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin) ||
    /^https:\/\/travel-together(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin) ||
    /^https:\/\/travel-together-[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
    /^https:\/\/travel-together-[a-z0-9-]+-riteshs-projects-[a-z0-9-]+\.vercel\.app$/i.test(origin)
  );
};

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin) || isVercelPreviewOrigin(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
};

// Sentry request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Limit payload sizes to mitigate large body DoS
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
// Some server environments expose read-only request properties (getter-only).
// The default `express-mongo-sanitize` middleware assigns `req[key] = target` which
// can throw when a property is not writable. Use the in-place sanitizer instead
// to avoid reassigning the whole property.
app.use((req, res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key] && typeof req[key] === 'object') {
      try {
        // call the library's sanitize helper which mutates the object in-place
        if (typeof mongoSanitize.sanitize === 'function') {
          mongoSanitize.sanitize(req[key]);
        }
      } catch (e) {
        // ignore sanitize errors and continue
      }
    }
  });
  next();
});

// Sanitize user input coming from POST body, GET queries, and url params
// Implement in-place sanitization to avoid reassigning request properties
const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach((k) => {
    try {
      const v = obj[k];
      if (v && typeof v === 'object') {
        sanitizeInPlace(v);
      } else if (typeof v === 'string') {
        obj[k] = xssFilters.inHTMLData(v).trim();
      }
    } catch (e) {
      // ignore individual sanitize failures
    }
  });
};

app.use((req, res, next) => {
  ['body', 'params', 'query', 'headers'].forEach((key) => {
    if (req[key] && typeof req[key] === 'object') {
      try {
        sanitizeInPlace(req[key]);
      } catch (e) {
        // ignore
      }
    }
  });
  next();
});

// Prometheus metrics collection (exposed at /metrics)
try {
  const collectDefaultMetrics = client.collectDefaultMetrics;
  const register = client.register;
  // collect default node metrics with a prefix to avoid collisions
  collectDefaultMetrics({ prefix: 'travel_together_' });
  // attach register to app for testing or other uses
  app.locals.metricsRegister = register;
  // HTTP request duration histogram (seconds)
  try {
    const httpRequestDurationSeconds = new client.Histogram({
      name: 'travel_together_http_request_duration_seconds',
      help: 'HTTP request duration in seconds for Travel Together',
      labelNames: ['method', 'route', 'status'],
      // buckets tuned for typical API latencies (s): from 1ms to 10s
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    });

    // attach to app locals for testing or inspection
    app.locals.httpRequestDurationSeconds = httpRequestDurationSeconds;

    // normalize dynamic segments (ObjectId, numeric ids) to improve grouping
    const normalizeRoute = (route) => {
      if (!route || typeof route !== 'string') return 'unknown';
      // replace 24-hex mongo ids
      route = route.replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id');
      // replace numeric ids
      route = route.replace(/\/\d+(?=\/|$)/g, '/:id');
      return route;
    };

    // middleware to measure request durations
    app.use((req, res, next) => {
      const start = process.hrtime();
      res.on('finish', () => {
        try {
          const diff = process.hrtime(start);
          const durationSeconds = diff[0] + diff[1] / 1e9;
          // prefer mounted route path when available
          const routePath =
            (req.baseUrl || '') + (req.route && req.route.path ? req.route.path : req.path || '');
          const route = normalizeRoute(routePath || req.originalUrl || 'unknown');
          httpRequestDurationSeconds
            .labels(req.method, route, String(res.statusCode))
            .observe(durationSeconds);
        } catch (e) {
          // ignore metric failures
        }
      });

      next();
    });
  } catch (e) {
    // ignore histogram setup errors
  }
} catch (e) {
  // prom-client may not be installed in some environments; skip metrics if unavailable
}

// Global rate limiting
app.use(globalLimiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Travel Together API is running',
  });
});

// Readiness check: verifies DB connectivity and basic filesystem access
app.get('/api/ready', async (req, res) => {
  const details = { db: 'unknown', uploads: 'unknown' };
  let ready = true;

  try {
    const state = mongoose.connection.readyState; // 1 = connected
    details.db = state;

    if (
      state === 1 &&
      mongoose.connection.db &&
      typeof mongoose.connection.db.admin === 'function'
    ) {
      try {
        // ping the primary to ensure the connection and server are responsive

        await mongoose.connection.db.admin().ping();
        details.db = 'ok';
      } catch (e) {
        details.db = `error: ${e && e.message ? e.message : String(e)}`;
        ready = false;
      }
    } else {
      ready = false;
    }
  } catch (e) {
    details.db = `error: ${e && e.message ? e.message : String(e)}`;
    ready = false;
  }

  try {
    const uploadsPath = path.join(__dirname, 'uploads');
    await fs.access(uploadsPath);
    details.uploads = 'ok';
  } catch (e) {
    details.uploads = `error: ${e && e.message ? e.message : String(e)}`;
    // uploads missing is not fatal for some deployments, do not flip ready by default
  }

  if (ready) {
    return res.status(200).json({ status: 'ready', details });
  }

  return res.status(503).json({ status: 'not ready', details });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const register = app.locals.metricsRegister;
    if (!register) {
      return res.status(404).send('metrics not enabled');
    }

    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    return res.send(metrics);
  } catch (e) {
    return res
      .status(500)
      .send(`failed to collect metrics: ${e && e.message ? e.message : String(e)}`);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/match', matchingRoutes);
app.use('/internal', internalRoutes);

// Capture errors with Sentry first, then pass to custom error handler
app.use(Sentry.Handlers.errorHandler());
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error('JWT secret not configured'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return next(new Error('Unauthorized'));
    }

    const user = await User.findById(String(userId)).select('name');

    if (!user) {
      return next(new Error('Session expired. Please log in again.'));
    }

    socket.userId = String(user._id);
    socket.userName = user.name;
    next();
  } catch (_error) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('joinTrip', async (tripId) => {
    try {
      if (!tripId || !mongoose.Types.ObjectId.isValid(tripId)) {
        socket.emit('chatError', {
          message: 'Invalid trip id',
        });
        return;
      }

      const trip = await Trip.findOne({
        _id: tripId,
        members: socket.userId,
      }).select('_id');

      if (!trip) {
        socket.emit('chatError', {
          message: 'Join the trip first to access chat',
        });
        return;
      }

      socket.join(String(trip._id));
    } catch (error) {
      socket.emit('chatError', {
        message: 'Failed to join chat room',
      });
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      if (!data || !data.tripId || !data.message) {
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(data.tripId)) {
        socket.emit('chatError', {
          message: 'Invalid trip id',
        });
        return;
      }

      const text = String(data.message).trim();

      if (!text) {
        return;
      }

      const trip = await Trip.findOne({
        _id: data.tripId,
        members: socket.userId,
      }).select('_id');

      if (!trip) {
        socket.emit('chatError', {
          message: 'Join the trip first to send messages',
        });
        return;
      }

      const messageDoc = await Message.create({
        tripId: data.tripId,
        senderId: socket.userId,
        text,
      });

      const payload = {
        _id: String(messageDoc._id),
        tripId: String(messageDoc.tripId),
        senderId: String(messageDoc.senderId),
        senderName: socket.userName,
        text,
        createdAt: messageDoc.createdAt,
      };

      io.to(String(trip._id)).emit('receiveMessage', payload);
    } catch (error) {
      socket.emit('chatError', {
        message: 'Failed to send message',
      });
    }
  });

  socket.on('getTripMemberCounts', async (tripId) => {
    try {
      if (!tripId || !mongoose.Types.ObjectId.isValid(tripId)) {
        socket.emit('tripMemberCountsError', {
          message: 'Invalid trip id',
        });
        return;
      }

      const trip = await Trip.findById(tripId).select('members').populate('members', 'name');

      if (!trip) {
        socket.emit('tripMemberCountsError', {
          message: 'Trip not found',
        });
        return;
      }

      const safeMembers = Array.isArray(trip.members) ? trip.members : [];

      socket.emit('tripMemberCounts', {
        tripId: String(trip._id),
        members: safeMembers,
        joinedCount: safeMembers.length,
      });
    } catch (error) {
      socket.emit('tripMemberCountsError', {
        message: 'Failed to fetch trip member counts',
      });
    }
  });
});

const startServer = async () => {
  try {
    await connectDB();

    // Optional: server-startup cleanup to delete a seeded/default user.
    try {
      const doCleanup =
        String(process.env.DELETE_DEFAULT_ON_STARTUP || '').toLowerCase() === 'true';
      const defaultEmail = process.env.DEFAULT_USER_EMAIL;

      if (doCleanup && defaultEmail) {
        const normalized = String(defaultEmail).toLowerCase().trim();
        const removed = await User.findOneAndDelete({ email: normalized });

        if (removed) {
          console.log(`Startup cleanup: removed default user ${normalized}`);
        } else {
          console.log(`Startup cleanup: no default user ${normalized} found`);
        }
      }
    } catch (cleanupErr) {
      console.warn(
        'Startup cleanup failed:',
        cleanupErr && cleanupErr.message ? cleanupErr.message : cleanupErr
      );
    }
    let currentPort = Number(PORT);

    const listenOnPort = (port) =>
      new Promise((resolve, reject) => {
        const onError = (error) => {
          server.off('listening', onListening);
          reject(error);
        };

        const onListening = () => {
          server.off('error', onError);
          resolve();
        };

        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port);
      });

    while (true) {
      try {
        await listenOnPort(currentPort);
        console.log(`Server running on port ${currentPort}`);
        break;
      } catch (error) {
        if (error && error.code === 'EADDRINUSE') {
          const nextPort = currentPort + 1;
          console.warn(`Port ${currentPort} is in use. Retrying on port ${nextPort}...`);
          currentPort = nextPort;
          continue;
        }

        throw error;
      }
    }
  } catch (error) {
    process.exit(1);
  }
};

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  } catch (error) {
    if (error.code !== 'ERR_SERVER_NOT_RUNNING') {
      console.error('Failed to close HTTP server:', error.message);
    }
  }

  try {
    await closeDB();
  } catch (error) {
    console.error('Failed to close MongoDB connection:', error.message);
  }

  process.exit(0);
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

startServer();

// Capture unhandled rejections and uncaught exceptions
process.on('unhandledRejection', async (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  console.error('Unhandled Rejection:', error);

  try {
    Sentry.captureException(error);
    await Sentry.close(2000);
  } catch (captureError) {
    console.error('Failed to report unhandled rejection to Sentry:', captureError);
  }
});

process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);

  try {
    Sentry.captureException(err);
    await Sentry.close(2000);
  } catch (captureError) {
    console.error('Failed to report uncaught exception to Sentry:', captureError);
  } finally {
    process.exit(1);
  }
});
