const PaymentService = require('../services/payment.service');
const Order = require('../models/order.model');
const NotificationService = require('../services/notification.service');

// Create payment intent for an order
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'تم دفع الطلب مسبقاً'
      });
    }

    const paymentIntent = await PaymentService.createPaymentIntent(order);

    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء عملية الدفع',
      error: error.message
    });
  }
};

// Handle webhook events from Stripe
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await PaymentService.handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await PaymentService.handlePaymentFailure(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'فشل في معالجة حدث Webhook',
      error: error.message
    });
  }
};

// Process refund for an order
exports.refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن استرداد المبلغ - الطلب غير مدفوع'
      });
    }

    const refundedOrder = await PaymentService.refundPayment(order);

    res.json({
      success: true,
      message: 'تم استرداد المبلغ بنجاح',
      order: refundedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إجراء عملية الاسترداد',
      error: error.message
    });
  }
};

// Get saved payment methods for a customer
exports.getPaymentMethods = async (req, res) => {
  try {
    const customerId = req.user.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم العثور على معرف العميل'
      });
    }

    const paymentMethods = await PaymentService.getPaymentMethods(customerId);

    res.json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب وسائل الدفع',
      error: error.message
    });
  }
};

// Record cash payment for an order
exports.recordCashPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'تم دفع الطلب مسبقاً'
      });
    }

    // Verify amount matches order total
    if (amount !== order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ المدفوع غير مطابق لقيمة الطلب'
      });
    }

    // Update order payment status
    order.paymentStatus = 'paid';
    order.paymentDetails = {
      paidAmount: amount,
      paidAt: new Date(),
      collectedBy: req.user._id
    };

    await order.save();

    // Send notification
    await NotificationService.paymentReceived(order);

    res.json({
      success: true,
      message: 'تم تسجيل الدفع بنجاح',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تسجيل الدفع',
      error: error.message
    });
  }
};

// Get payment status for an order
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .select('paymentStatus paymentDetails totalAmount')
      .populate('paymentDetails.collectedBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    res.json({
      success: true,
      payment: {
        status: order.paymentStatus,
        amount: order.totalAmount,
        details: order.paymentDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب حالة الدفع',
      error: error.message
    });
  }
};
