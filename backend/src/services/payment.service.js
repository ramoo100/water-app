const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/order.model');
const NotificationService = require('./notification.service');

class PaymentService {
  static async createPaymentIntent(order) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        currency: 'sar',
        metadata: {
          orderId: order._id.toString(),
          customerId: order.customer.toString()
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('فشل في إنشاء عملية الدفع');
    }
  }

  static async handlePaymentSuccess(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      // Update order payment status
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        paymentId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method_types[0],
        paidAmount: paymentIntent.amount / 100,
        paidAt: new Date()
      };

      await order.save();

      // Send notifications
      await NotificationService.paymentReceived(order);

      return order;
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw new Error('فشل في تحديث حالة الدفع');
    }
  }

  static async handlePaymentFailure(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      // Update order payment status
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        paymentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message,
        failedAt: new Date()
      };

      await order.save();

      return order;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw new Error('فشل في تحديث حالة الدفع');
    }
  }

  static async refundPayment(order) {
    try {
      if (!order.paymentDetails?.paymentId) {
        throw new Error('لا يوجد معرف دفع للطلب');
      }

      const refund = await stripe.refunds.create({
        payment_intent: order.paymentDetails.paymentId,
        metadata: {
          orderId: order._id.toString(),
          reason: 'customer_request'
        }
      });

      // Update order payment status
      order.paymentStatus = 'refunded';
      order.paymentDetails.refundId = refund.id;
      order.paymentDetails.refundedAt = new Date();

      await order.save();

      return order;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('فشل في إجراء عملية الاسترداد');
    }
  }

  static async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new Error('فشل في جلب وسائل الدفع');
    }
  }
}

module.exports = PaymentService;
