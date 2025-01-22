const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth');
const { isAdmin, isWorker } = require('../middleware/roles');

// Create payment intent
router.post('/create-payment-intent', auth, paymentController.createPaymentIntent);

// Handle Stripe webhook
router.post('/webhook', paymentController.handleWebhook);

// Process refund (admin only)
router.post('/refund/:orderId', auth, isAdmin, paymentController.refundPayment);

// Get customer's saved payment methods
router.get('/payment-methods', auth, paymentController.getPaymentMethods);

// Record cash payment (worker only)
router.post('/cash/:orderId', auth, isWorker, paymentController.recordCashPayment);

// Get payment status
router.get('/status/:orderId', auth, paymentController.getPaymentStatus);

module.exports = router;
