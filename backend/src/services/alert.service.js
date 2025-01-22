const CashShortage = require('../models/cashShortage.model');
const User = require('../models/user.model');
const NotificationService = require('./notification.service');

class AlertService {
  static async checkDailyShortages() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all shortages reported today
      const shortages = await CashShortage.find({
        createdAt: { $gte: today },
        status: 'pending'
      }).populate('worker', 'name');

      if (shortages.length > 0) {
        const totalShortage = shortages.reduce((sum, s) => sum + s.shortageAmount, 0);
        
        // Alert admins about total daily shortages
        NotificationService.notifyAdmins('DAILY_SHORTAGE_ALERT', {
          date: today.toISOString().split('T')[0],
          totalShortage,
          shortagesCount: shortages.length,
          details: shortages.map(s => ({
            worker: s.worker.name,
            amount: s.shortageAmount,
            reason: s.reason
          }))
        });
      }
    } catch (error) {
      console.error('Error checking daily shortages:', error);
    }
  }

  static async checkWorkerShortagePattern(workerId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get worker's shortages in last 30 days
      const shortages = await CashShortage.find({
        worker: workerId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      if (shortages.length >= 3) {
        const totalAmount = shortages.reduce((sum, s) => sum + s.shortageAmount, 0);
        const worker = await User.findById(workerId);

        // Alert admins about worker shortage pattern
        NotificationService.notifyAdmins('WORKER_SHORTAGE_PATTERN', {
          workerId,
          workerName: worker.name,
          shortagesCount: shortages.length,
          totalAmount,
          period: '30 days'
        });
      }
    } catch (error) {
      console.error('Error checking worker shortage pattern:', error);
    }
  }

  static async checkLargeShortages(threshold = 1000) {
    try {
      const shortages = await CashShortage.find({
        shortageAmount: { $gte: threshold },
        status: 'pending'
      }).populate('worker', 'name');

      shortages.forEach(shortage => {
        // Alert admins about large shortages
        NotificationService.notifyAdmins('LARGE_SHORTAGE_ALERT', {
          shortageId: shortage._id,
          workerName: shortage.worker.name,
          amount: shortage.shortageAmount,
          reason: shortage.reason,
          date: shortage.createdAt
        });
      });
    } catch (error) {
      console.error('Error checking large shortages:', error);
    }
  }

  static async checkUnresolvedShortages() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const unresolved = await CashShortage.find({
        status: 'pending',
        createdAt: { $lte: threeDaysAgo }
      }).populate('worker', 'name');

      if (unresolved.length > 0) {
        // Alert admins about unresolved shortages
        NotificationService.notifyAdmins('UNRESOLVED_SHORTAGES_ALERT', {
          count: unresolved.length,
          shortages: unresolved.map(s => ({
            id: s._id,
            worker: s.worker.name,
            amount: s.shortageAmount,
            reportedAt: s.createdAt
          }))
        });
      }
    } catch (error) {
      console.error('Error checking unresolved shortages:', error);
    }
  }
}

module.exports = AlertService;
