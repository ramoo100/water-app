// Admin middleware
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح بالوصول - مسموح للمشرفين فقط'
    });
  }
  next();
};

// Worker middleware
exports.isWorker = (req, res, next) => {
  if (req.user.role !== 'worker') {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح بالوصول - مسموح للعمال فقط'
    });
  }
  next();
};

// Customer middleware
exports.isCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح بالوصول - مسموح للعملاء فقط'
    });
  }
  next();
};
