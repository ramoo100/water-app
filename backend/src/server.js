require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socketService = require('./services/socket.service');
const AlertService = require('./services/alert.service');
const SchedulerService = require('./services/scheduler.service');

// Import routes
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const workerRoutes = require('./routes/worker.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const cashRoutes = require('./routes/cash.routes');
const cashHandlingRoutes = require('./routes/cashHandling.routes');
const analysisRoutes = require('./routes/analysis.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketService.initSocket(server);

// Setup automated alerts
const setupAlerts = () => {
  // Check daily shortages every day at 23:00
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 23 && now.getMinutes() === 0) {
      await AlertService.checkDailyShortages();
    }
  }, 60000); // Check every minute

  // Check large shortages every hour
  setInterval(async () => {
    await AlertService.checkLargeShortages();
  }, 3600000);

  // Check unresolved shortages every 12 hours
  setInterval(async () => {
    await AlertService.checkUnresolvedShortages();
  }, 43200000);
};

// Middleware
app.use(cors());

// Special handling for Stripe webhook
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Regular middleware for other routes
app.use(express.json());
app.use(morgan('dev'));

// Add socket instance to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/cash-handling', cashHandlingRoutes);
app.use('/api/analysis', analysisRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-delivery')
  .then(() => {
    console.log('Connected to MongoDB successfully');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      setupAlerts(); // Start automated alerts
      SchedulerService.initialize(); // Initialize scheduled reports
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
