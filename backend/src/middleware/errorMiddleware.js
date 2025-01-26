const { formatError, handleValidationError, handleJWTError, handleJWTExpiredError } = require('../../src/utils/errorHandler');

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle specific error types
  let error = { ...err };
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // JWT invalid signature
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        status: err.status,
        message: err.message,
        stack: err.stack
      }
    });
  }

  // Production error response
  if (error.isOperational) {
    return res.status(error.statusCode).json(formatError(error));
  }

  // Programming or unknown errors: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع'
  });
};

module.exports = errorMiddleware;
