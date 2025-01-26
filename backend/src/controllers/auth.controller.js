const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { AppError, asyncHandler } = require('../../src/utils/errorHandler');
const rateLimit = require('express-rate-limit');
const { validatePassword } = require('../utils/validators');

// Create JWT Token
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Rate limiting for login attempts
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح، الرجاء المحاولة لاحقاً'
});

// Register new user
exports.register = asyncHandler(async (req, res, next) => {
  const { name, phone, password, address, location } = req.body;

  // Validate required fields
  if (!name || !phone || !password) {
    throw new AppError('جميع الحقول مطلوبة', 400);
  }

  // Validate password strength
  if (!validatePassword(password)) {
    throw new AppError('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وتتضمن أحرف كبيرة وصغيرة وأرقام ورموز خاصة', 400);
  }

  // Validate phone format
  const phoneRegex = /^(\+?963|0)?9\d{8}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    throw new AppError('رقم الهاتف غير صالح', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new AppError('رقم الهاتف مسجل مسبقاً', 400);
  }

  // Create new user
  const user = await User.create({
    name,
    phone,
    password,
    address,
    location: location ? {
      type: 'Point',
      coordinates: location
    } : undefined
  });

  // Create token
  const token = createToken(user);

  res.status(201).json({
    success: true,
    message: 'تم التسجيل بنجاح',
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

// Login user
exports.login = asyncHandler(async (req, res, next) => {
  const { phone, password } = req.body;

  // Validate required fields
  if (!phone || !password) {
    throw new AppError('الرجاء إدخال رقم الهاتف وكلمة المرور', 400);
  }

  // Find user
  const user = await User.findOne({ phone }).select('+password');
  if (!user) {
    throw new AppError('رقم الهاتف أو كلمة المرور غير صحيحة', 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('رقم الهاتف أو كلمة المرور غير صحيحة', 401);
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('الحساب غير مفعل', 401);
  }

  // Create token
  const token = createToken(user);

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

// Get current user
exports.getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('المستخدم غير موجود', 404);
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

// Add refresh token functionality
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const token = createToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
});
