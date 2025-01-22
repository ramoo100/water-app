const CashShortage = require('../models/cashShortage.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const ExportService = require('../services/export.service');
const path = require('path');

// Get shortage analysis dashboard data
exports.getShortageAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, export: exportData } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get overall shortage statistics
    const [
      totalShortages,
      resolvedShortages,
      totalAmount,
      workerStats
    ] = await Promise.all([
      CashShortage.countDocuments(query),
      CashShortage.countDocuments({ ...query, status: 'resolved' }),
      CashShortage.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$shortageAmount' } } }
      ]),
      CashShortage.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$worker',
            totalShortages: { $sum: 1 },
            totalAmount: { $sum: '$shortageAmount' },
            resolvedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
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
        { $unwind: '$worker' }
      ])
    ]);

    // Get monthly trend
    const monthlyTrend = await CashShortage.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$shortageAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const data = {
      statistics: {
        totalShortages,
        resolvedShortages,
        pendingShortages: totalShortages - resolvedShortages,
        totalAmount: totalAmount[0]?.total || 0,
        resolutionRate: (resolvedShortages / totalShortages) * 100
      },
      workerStats,
      monthlyTrend
    };

    if (exportData === 'true') {
      const fileName = await ExportService.exportShortageReport(data, { startDate, endDate });
      return res.json({
        success: true,
        message: 'تم تصدير التقرير بنجاح',
        downloadUrl: `/api/analysis/download/${fileName}`
      });
    }

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تحليل النقص',
      error: error.message
    });
  }
};

// Get worker performance metrics
exports.getWorkerPerformance = async (req, res) => {
  try {
    const { startDate, endDate, workerId, export: exportData } = req.query;
    const query = {};

    if (workerId) {
      query.worker = workerId;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get worker's order statistics
    const orderStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$worker',
          totalOrders: { $sum: 1 },
          totalCollected: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgRating: { $avg: '$rating.score' }
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
      { $unwind: '$worker' }
    ]);

    // Get shortage statistics
    const shortageStats = await CashShortage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$worker',
          shortagesCount: { $sum: 1 },
          totalShortageAmount: { $sum: '$shortageAmount' },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    // Combine order and shortage stats
    const performance = orderStats.map(stat => {
      const shortage = shortageStats.find(s => s._id.equals(stat._id)) || {
        shortagesCount: 0,
        totalShortageAmount: 0,
        resolvedCount: 0
      };

      return {
        worker: {
          id: stat.worker._id,
          name: stat.worker.name
        },
        orders: {
          total: stat.totalOrders,
          completed: stat.completedOrders,
          completionRate: (stat.completedOrders / stat.totalOrders) * 100
        },
        collections: {
          total: stat.totalCollected,
          shortages: shortage.shortagesCount,
          shortageAmount: shortage.totalShortageAmount,
          shortageRate: (shortage.shortagesCount / stat.totalOrders) * 100
        },
        rating: stat.avgRating || 0
      };
    });

    if (exportData === 'true') {
      const fileName = await ExportService.exportWorkerPerformance({ performance }, { startDate, endDate });
      return res.json({
        success: true,
        message: 'تم تصدير تقرير الأداء بنجاح',
        downloadUrl: `/api/analysis/download/${fileName}`
      });
    }

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب مؤشرات الأداء',
      error: error.message
    });
  }
};

// Get detailed worker metrics
exports.getWorkerMetrics = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate, export: exportData } = req.query;

    const query = { worker: workerId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get daily metrics
    const dailyMetrics = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          ordersCount: { $sum: 1 },
          collectionsAmount: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get shortage history
    const shortageHistory = await CashShortage.find(query)
      .select('shortageAmount reason status createdAt')
      .sort('-createdAt');

    // Get performance summary
    const performanceSummary = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalCollections: { $sum: '$totalAmount' },
          avgRating: { $avg: '$rating.score' }
        }
      }
    ]);

    const data = {
      metrics: {
        daily: dailyMetrics,
        shortages: shortageHistory,
        summary: performanceSummary[0] || {
          totalOrders: 0,
          completedOrders: 0,
          totalCollections: 0,
          avgRating: 0
        }
      }
    };

    if (exportData === 'true') {
      const fileName = await ExportService.exportWorkerMetrics(data, workerId);
      return res.json({
        success: true,
        message: 'تم تصدير مؤشرات العامل بنجاح',
        downloadUrl: `/api/analysis/download/${fileName}`
      });
    }

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب مؤشرات العامل',
      error: error.message
    });
  }
};

// Download exported file
exports.downloadReport = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, '../exports', fileName);

    if (!fileName.endsWith('.xlsx')) {
      return res.status(400).json({
        success: false,
        message: 'نوع الملف غير صالح'
      });
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        res.status(404).json({
          success: false,
          message: 'الملف غير موجود'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تحميل الملف',
      error: error.message
    });
  }
};
