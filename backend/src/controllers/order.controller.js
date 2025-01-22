const Order = require('../models/order.model');
const User = require('../models/user.model');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { products, deliveryAddress, deliveryLocation, paymentMethod } = req.body;

    const order = new Order({
      customer: req.user.id,
      products,
      deliveryAddress,
      deliveryLocation: {
        type: 'Point',
        coordinates: deliveryLocation
      },
      paymentMethod
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الطلب',
      error: error.message
    });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .populate('worker', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطلبات',
      error: error.message
    });
  }
};

// Get customer orders
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('worker', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطلبات',
      error: error.message
    });
  }
};

// Get worker orders
exports.getWorkerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      worker: req.user.id,
      status: { $in: ['assigned', 'in_progress'] }
    })
      .populate('customer', 'name phone address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطلبات',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'تحديث الحالة غير مسموح'
      });
    }

    order.status = status;
    if (note) {
      order.statusHistory.push({ status, note });
    }

    await order.save();

    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الطلب',
      error: error.message
    });
  }
};

// Assign order to worker
exports.assignOrderToWorker = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { workerId } = req.body;

    // Check if worker exists and is active
    const worker = await User.findOne({
      _id: workerId,
      role: 'worker',
      status: 'active'
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'العامل غير موجود أو غير نشط'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعيين عامل للطلب في هذه الحالة'
      });
    }

    order.worker = workerId;
    order.status = 'assigned';
    order.statusHistory.push({
      status: 'assigned',
      note: `تم تعيين العامل ${worker.name}`
    });

    await order.save();

    res.json({
      success: true,
      message: 'تم تعيين العامل للطلب بنجاح',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تعيين العامل',
      error: error.message
    });
  }
};
