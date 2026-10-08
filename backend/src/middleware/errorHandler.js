import env from '../config/env.js';

export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode =
    Number.isInteger(error.statusCode)
      ? error.statusCode
      : error.name === 'ValidationError' || error.name === 'CastError'
        ? 400
        : error.code === 11000
          ? 409
          : 500;

  const message =
    statusCode >= 500 && env.isProduction
      ? 'Internal server error'
      : error.message;

  if (statusCode >= 500) {
    console.error('Request failed', {
      name: error.name,
      method: req.method,
      path: req.path,
    });
  }

  res.status(statusCode).json({
    error: { message },
  });
}