const cron = require('node-cron');
const moment = require('moment');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const CashShortage = require('../models/cashShortage.model');
const ExportService = require('./export.service');
const PDFExportService = require('./pdfExport.service');
const NotificationService = require('./notification.service');

class SchedulerService {
  static schedules = [];

  static async initialize() {
    // Daily reports at 23:30
    this.schedules.push(
      cron.schedule('30 23 * * *', async () => {
        await this.generateDailyReports();
      })
    );

    // Weekly reports on Sunday at 00:00
    this.schedules.push(
      cron.schedule('0 0 * * 0', async () => {
        await this.generateWeeklyReports();
      })
    );

    // Monthly reports on 1st of each month at 01:00
    this.schedules.push(
      cron.schedule('0 1 1 * *', async () => {
        await this.generateMonthlyReports();
      })
    );
  }

  static async generateDailyReports() {
    try {
      const today = moment().startOf('day');
      const tomorrow = moment(today).add(1, 'day');

      // Get daily statistics
      const [orders, shortages, workers] = await Promise.all([
        Order.find({
          createdAt: { $gte: today.toDate(), $lt: tomorrow.toDate() }
        }),
        CashShortage.find({
          createdAt: { $gte: today.toDate(), $lt: tomorrow.toDate() }
        }),
        User.find({ role: 'worker' })
      ]);

      // Prepare daily data
      const dailyData = {
        date: today.format('YYYY-MM-DD'),
        totalCollections: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        totalOrders: orders.length,
        shortagesCount: shortages.length,
        workers: await Promise.all(workers.map(async worker => {
          const workerOrders = orders.filter(o => o.worker.equals(worker._id));
          const workerShortages = shortages.filter(s => s.worker.equals(worker._id));

          return {
            id: worker._id,
            name: worker.name,
            completedOrders: workerOrders.filter(o => o.status === 'completed').length,
            collections: workerOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            shortages: workerShortages.length
          };
        }))
      };

      // Generate reports in both formats
      const [excelFile, pdfFile] = await Promise.all([
        ExportService.exportDailyReport(dailyData),
        PDFExportService.createPDF(dailyData, 'daily', {
          title: `التقرير اليومي - ${today.format('YYYY-MM-DD')}`
        })
      ]);

      // Notify admins
      await NotificationService.notifyAdmins('DAILY_REPORT', {
        date: today.format('YYYY-MM-DD'),
        excelDownload: `/api/analysis/download/${excelFile}`,
        pdfDownload: `/api/analysis/download/${pdfFile}`,
        summary: {
          totalOrders: dailyData.totalOrders,
          totalCollections: dailyData.totalCollections,
          shortagesCount: dailyData.shortagesCount
        }
      });
    } catch (error) {
      console.error('Error generating daily reports:', error);
    }
  }

  static async generateWeeklyReports() {
    try {
      const startOfWeek = moment().subtract(1, 'week').startOf('week');
      const endOfWeek = moment().subtract(1, 'week').endOf('week');

      // Get weekly data
      const [orders, shortages, workers] = await Promise.all([
        Order.find({
          createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
        }),
        CashShortage.find({
          createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
        }),
        User.find({ role: 'worker' })
      ]);

      // Prepare weekly performance data
      const weeklyData = {
        period: {
          start: startOfWeek.format('YYYY-MM-DD'),
          end: endOfWeek.format('YYYY-MM-DD')
        },
        performance: await Promise.all(workers.map(async worker => {
          const workerOrders = orders.filter(o => o.worker.equals(worker._id));
          const workerShortages = shortages.filter(s => s.worker.equals(worker._id));

          return {
            worker: {
              id: worker._id,
              name: worker.name
            },
            orders: {
              total: workerOrders.length,
              completed: workerOrders.filter(o => o.status === 'completed').length
            },
            collections: {
              total: workerOrders.reduce((sum, o) => sum + o.totalAmount, 0),
              shortages: workerShortages.length,
              shortageAmount: workerShortages.reduce((sum, s) => sum + s.shortageAmount, 0)
            }
          };
        }))
      };

      // Generate reports
      const [excelFile, pdfFile] = await Promise.all([
        ExportService.exportWorkerPerformance(weeklyData, weeklyData.period),
        PDFExportService.createPDF(weeklyData, 'performance', {
          title: `التقرير الأسبوعي - ${startOfWeek.format('YYYY-MM-DD')} to ${endOfWeek.format('YYYY-MM-DD')}`
        })
      ]);

      // Notify admins
      await NotificationService.notifyAdmins('WEEKLY_REPORT', {
        period: weeklyData.period,
        excelDownload: `/api/analysis/download/${excelFile}`,
        pdfDownload: `/api/analysis/download/${pdfFile}`
      });
    } catch (error) {
      console.error('Error generating weekly reports:', error);
    }
  }

  static async generateMonthlyReports() {
    try {
      const startOfMonth = moment().subtract(1, 'month').startOf('month');
      const endOfMonth = moment().subtract(1, 'month').endOf('month');

      // Get monthly shortage data
      const shortageData = await CashShortage.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth.toDate(),
              $lte: endOfMonth.toDate()
            }
          }
        },
        {
          $group: {
            _id: {
              worker: '$worker',
              status: '$status'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$shortageAmount' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id.worker',
            foreignField: '_id',
            as: 'worker'
          }
        }
      ]);

      // Prepare monthly report data
      const monthlyData = {
        period: {
          start: startOfMonth.format('YYYY-MM-DD'),
          end: endOfMonth.format('YYYY-MM-DD')
        },
        shortages: shortageData
      };

      // Generate reports
      const [excelFile, pdfFile] = await Promise.all([
        ExportService.exportShortageReport(monthlyData, monthlyData.period),
        PDFExportService.createPDF(monthlyData, 'shortage', {
          title: `التقرير الشهري - ${startOfMonth.format('YYYY-MM')}}`
        })
      ]);

      // Notify admins
      await NotificationService.notifyAdmins('MONTHLY_REPORT', {
        period: monthlyData.period,
        excelDownload: `/api/analysis/download/${excelFile}`,
        pdfDownload: `/api/analysis/download/${pdfFile}`
      });
    } catch (error) {
      console.error('Error generating monthly reports:', error);
    }
  }

  static stopAll() {
    this.schedules.forEach(schedule => schedule.stop());
    this.schedules = [];
  }
}

module.exports = SchedulerService;
