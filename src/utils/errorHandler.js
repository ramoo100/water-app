// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error response formatter
const formatError = (error) => {
  return {
    success: false,
    message: error.message || 'حدث خطأ غير متوقع',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
};

// Async handler wrapper to eliminate try-catch blocks
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Input validation error handler
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => err.message);
  return new AppError(`خطأ في البيانات المدخلة: ${errors.join(', ')}`, 400);
};

// JWT error handler
const handleJWTError = () => 
  new AppError('جلسة غير صالحة، الرجاء تسجيل الدخول مرة أخرى', 401);

// JWT expired error handler
const handleJWTExpiredError = () => 
  new AppError('انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى', 401);

module.exports = {
  AppError,
  formatError,
  asyncHandler,
  handleValidationError,
  handleJWTError,
  handleJWTExpiredError
};
