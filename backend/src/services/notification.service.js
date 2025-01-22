const socketService = require('./socket.service');

class NotificationService {
  static async orderCreated(order) {
    // Notify admins
    socketService.notifyAdmins(socketService.NOTIFICATION_TYPES.NEW_ORDER, {
      orderId: order._id,
      customerName: order.customer.name,
      orderDetails: {
        products: order.products,
        totalAmount: order.totalAmount
      }
    });

    // Notify available workers in the area
    socketService.notifyWorkers(socketService.NOTIFICATION_TYPES.NEW_ORDER, {
      orderId: order._id,
      location: order.deliveryLocation
    });
  }

  static async orderStatusUpdated(order) {
    // Notify customer
    socketService.sendNotification(
      order.customer._id,
      'customer',
      socketService.NOTIFICATION_TYPES.ORDER_STATUS_UPDATED,
      {
        orderId: order._id,
        status: order.status,
        timestamp: new Date()
      }
    );

    // Notify worker if assigned
    if (order.worker) {
      socketService.sendNotification(
        order.worker._id,
        'worker',
        socketService.NOTIFICATION_TYPES.ORDER_STATUS_UPDATED,
        {
          orderId: order._id,
          status: order.status,
          timestamp: new Date()
        }
      );
    }

    // Notify admins
    socketService.notifyAdmins(socketService.NOTIFICATION_TYPES.ORDER_STATUS_UPDATED, {
      orderId: order._id,
      status: order.status,
      customerName: order.customer.name,
      workerName: order.worker?.name
    });
  }

  static async orderAssigned(order) {
    // Notify assigned worker
    socketService.sendNotification(
      order.worker._id,
      'worker',
      socketService.NOTIFICATION_TYPES.ORDER_ASSIGNED,
      {
        orderId: order._id,
        customerName: order.customer.name,
        deliveryAddress: order.deliveryAddress,
        products: order.products
      }
    );

    // Notify customer
    socketService.sendNotification(
      order.customer._id,
      'customer',
      socketService.NOTIFICATION_TYPES.ORDER_STATUS_UPDATED,
      {
        orderId: order._id,
        status: 'assigned',
        workerName: order.worker.name,
        timestamp: new Date()
      }
    );
  }

  static async paymentReceived(order) {
    // Notify customer
    socketService.sendNotification(
      order.customer._id,
      'customer',
      socketService.NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      {
        orderId: order._id,
        amount: order.paymentDetails.paidAmount,
        timestamp: order.paymentDetails.paidAt
      }
    );

    // Notify admins
    socketService.notifyAdmins(socketService.NOTIFICATION_TYPES.PAYMENT_RECEIVED, {
      orderId: order._id,
      customerName: order.customer.name,
      amount: order.paymentDetails.paidAmount,
      collectedBy: order.paymentDetails.collectedBy.name
    });
  }

  static async lowStockAlert(product) {
    // Notify admins
    socketService.notifyAdmins('LOW_STOCK_ALERT', {
      productId: product._id,
      productName: product.name,
      currentStock: product.stock,
      timestamp: new Date()
    });
  }

  static async workerLocationUpdated(workerId, location) {
    // Update worker location for active orders
    socketService.sendOrderUpdate(workerId, 'LOCATION_UPDATED', {
      location,
      timestamp: new Date()
    });
  }
}

module.exports = NotificationService;
