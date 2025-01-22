const Order = require('../models/order.model');
const User = require('../models/user.model');

// Get worker's daily cash collection
exports.getWorkerDailyCash = async (req, res) => {
  try {
    const workerId = req.user._id;
    const date = new Date(req.query.date || Date.now());
    date.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 1);

    const collections = await Order.find({
      'paymentDetails.collectedBy': workerId,
      'paymentDetails.paidAt': {
        $gte: date,
        $lt: endDate
      },
      paymentStatus: 'paid'
    })
    .select('orderNumber totalAmount paymentDetails customer')
    .populate('customer', 'name phone');

    const totalCollected = collections.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      success: true,
      date: date.toISOString().split('T')[0],
      collections,
      summary: {
        totalOrders: collections.length,
        totalAmount: totalCollected
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تقرير التحصيل اليومي',
      error: error.message
    });
  }
};

// Get worker's cash collection history
exports.getWorkerCashHistory = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const query = {
      'paymentDetails.collectedBy': workerId,
      paymentStatus: 'paid'
    };

    if (startDate && endDate) {
      query['paymentDetails.paidAt'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [collections, total] = await Promise.all([
      Order.find(query)
        .select('orderNumber totalAmount paymentDetails customer createdAt')
        .populate('customer', 'name phone')
        .sort('-paymentDetails.paidAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    const totalAmount = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      collections,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      },
      summary: {
        totalCollected: totalAmount[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب سجل التحصيل',
      error: error.message
    });
  }
};

// Get admin cash collection report
exports.getAdminCashReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {
      paymentStatus: 'paid'
    };

    if (startDate && endDate) {
      query['paymentDetails.paidAt'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const report = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentDetails.collectedBy',
          totalAmount: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 },
          collections: {
            $push: {
              orderId: '$_id',
              orderNumber: '$orderNumber',
              amount: '$totalAmount',
              paidAt: '$paymentDetails.paidAt'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'worker'
        }
      },
      {
        $unwind: '$worker'
      },
      {
        $project: {
          worker: {
            _id: '$worker._id',
            name: '$worker.name',
            phone: '$worker.phone'
          },
          totalAmount: 1,
          ordersCount: 1,
          collections: 1
        }
      }
    ]);

    const summary = {
      totalCollected: report.reduce((sum, worker) => sum + worker.totalAmount, 0),
      totalOrders: report.reduce((sum, worker) => sum + worker.ordersCount, 0),
      workersCount: report.length
    };

    res.json({
      success: true,
      report,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تقرير التحصيل',
      error: error.message
    });
  }
};

// Get daily cash reconciliation
exports.getDailyCashReconciliation = async (req, res) => {
  try {
    const date = new Date(req.query.date || Date.now());
    date.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 1);

    const reconciliation = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          'paymentDetails.paidAt': {
            $gte: date,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: '$paymentDetails.collectedBy',
          totalAmount: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 },
          orders: {
            $push: {
              orderId: '$_id',
              orderNumber: '$orderNumber',
              amount: '$totalAmount',
              paidAt: '$paymentDetails.paidAt'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'worker'
        }
      },
      {
        $unwind: '$worker'
      },
      {
        $project: {
          worker: {
            _id: '$worker._id',
            name: '$worker.name',
            phone: '$worker.phone'
          },
          totalAmount: 1,
          ordersCount: 1,
          orders: 1
        }
      }
    ]);

    const summary = {
      date: date.toISOString().split('T')[0],
      totalCollected: reconciliation.reduce((sum, worker) => sum + worker.totalAmount, 0),
      totalOrders: reconciliation.reduce((sum, worker) => sum + worker.ordersCount, 0),
      workersCount: reconciliation.length
    };

    res.json({
      success: true,
      date: date.toISOString().split('T')[0],
      reconciliation,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تقرير المطابقة اليومي',
      error: error.message
    });
  }
};
