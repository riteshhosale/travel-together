const notFound = (req, res, next) => {
  res.status(404).json({
    message: 'Route not found',
  });
};

const errorHandler = (err, req, res, next) => {
  // log full error server-side
  console.error(err && err.stack ? err.stack : err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const response = { message: 'Server error' };
  // expose error details during local development to aid debugging
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    response.error = {
      message: err && err.message ? err.message : String(err),
      stack: err && err.stack ? err.stack : undefined,
    };
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
