const socketIO = require('socket.io');

let io;

exports.initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    // Join room based on user role and ID
    socket.on('join', ({ userId, role }) => {
      socket.join(`${role}_${userId}`);
      if (role === 'worker') {
        socket.join('workers');
      }
    });

    // Handle location updates from workers
    socket.on('updateLocation', ({ workerId, location }) => {
      io.to(`worker_${workerId}`).emit('locationUpdated', { location });
      // Also emit to admin dashboard
      io.to('admin').emit('workerLocationUpdated', { workerId, location });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

// Notification types
const NOTIFICATION_TYPES = {
  NEW_ORDER: 'NEW_ORDER',
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  ORDER_ASSIGNED: 'ORDER_ASSIGNED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
};

// Send notification to specific user
exports.sendNotification = (userId, role, type, data) => {
  if (!io) return;

  io.to(`${role}_${userId}`).emit('notification', {
    type,
    data,
    timestamp: new Date()
  });
};

// Send notification to all admins
exports.notifyAdmins = (type, data) => {
  if (!io) return;

  io.to('admin').emit('notification', {
    type,
    data,
    timestamp: new Date()
  });
};

// Send notification to all workers
exports.notifyWorkers = (type, data) => {
  if (!io) return;

  io.to('workers').emit('notification', {
    type,
    data,
    timestamp: new Date()
  });
};

// Send order status update
exports.sendOrderUpdate = (orderId, status, data) => {
  if (!io) return;

  io.emit(`order_${orderId}`, {
    status,
    data,
    timestamp: new Date()
  });
};

exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
