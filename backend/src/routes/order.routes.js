const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../middleware/auth');
const { isAdmin, isWorker } = require('../middleware/roles');

// Create new order
router.post('/', auth, orderController.createOrder);

// Get all orders (admin only)
router.get('/all', auth, isAdmin, orderController.getAllOrders);

// Get customer orders
router.get('/customer', auth, orderController.getCustomerOrders);

// Get worker orders
router.get('/worker', auth, isWorker, orderController.getWorkerOrders);

// Update order status
router.patch('/:orderId/status', auth, orderController.updateOrderStatus);

// Assign order to worker (admin only)
router.patch('/:orderId/assign', auth, isAdmin, orderController.assignOrderToWorker);

module.exports = router;
