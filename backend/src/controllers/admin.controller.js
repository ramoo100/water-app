const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      activeWorkers,
      totalCustomers,
      totalRevenue,
      todayRevenue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({
        createdAt: { $gte: today }
      }),
      User.countDocuments({
        role: 'worker',
        status: 'active'
      }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: today }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        orders: {
          total: totalOrders,
          today: todayOrders
        },
        workers: {
          active: activeWorkers
        },
        customers: {
          total: totalCustomers
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات',
      error: error.message
    });
  }
};

// Get weekly orders chart data
exports.getWeeklyOrdersStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: orderStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات الطلبات الأسبوعية',
      error: error.message
    });
  }
};

// Get worker performance stats
exports.getWorkerStats = async (req, res) => {
  try {
    const workers = await User.aggregate([
      {
        $match: { role: 'worker' }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'worker',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          phone: 1,
          status: 1,
          totalOrders: { $size: '$orders' },
          completedOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.status', 'completed'] }
              }
            }
          },
          averageRating: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $ne: ['$$order.rating.score', null] }
                  }
                },
                as: 'order',
                in: '$$order.rating.score'
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      workers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات العمال',
      error: error.message
    });
  }
};

// Get customer insights
exports.getCustomerInsights = async (req, res) => {
  try {
    const insights = await User.aggregate([
      {
        $match: { role: 'customer' }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customer',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          phone: 1,
          totalOrders: { $size: '$orders' },
          totalSpent: {
            $sum: '$orders.totalAmount'
          },
          averageOrderValue: {
            $avg: '$orders.totalAmount'
          },
          lastOrderDate: {
            $max: '$orders.createdAt'
          }
        }
      },
      {
        $sort: { totalOrders: -1 }
      }
    ]);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تحليلات العملاء',
      error: error.message
    });
  }
};

// Get inventory status
exports.getInventoryStatus = async (req, res) => {
  try {
    const products = await Product.find()
      .select('name size unit stock price isAvailable')
      .sort('-stock');

    const lowStockThreshold = 10;
    const lowStockProducts = products.filter(p => p.stock < lowStockThreshold);

    res.json({
      success: true,
      products,
      alerts: {
        lowStock: lowStockProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب حالة المخزون',
      error: error.message
    });
  }
};
