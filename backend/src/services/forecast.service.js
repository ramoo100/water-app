const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const AlertService = require('./alert.service');

class ForecastService {
  static async calculateDemandForecast(productId, warehouseId, days = 30) {
    // حساب الطلب اليومي للأيام السابقة
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await Order.find({
      'items.product': productId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    // تجميع الطلبات حسب اليوم
    const dailyDemand = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const item = order.items.find(i => i.product.toString() === productId);
      if (item) {
        dailyDemand[date] = (dailyDemand[date] || 0) + item.quantity;
      }
    });

    // حساب المتوسط والانحراف المعياري
    const demands = Object.values(dailyDemand);
    const averageDemand = demands.reduce((a, b) => a + b, 0) / demands.length;
    const variance = demands.reduce((a, b) => a + Math.pow(b - averageDemand, 2), 0) / demands.length;
    const stdDev = Math.sqrt(variance);

    // حساب مستوى الأمان
    const safetyStock = Math.ceil(stdDev * 1.96); // 95% مستوى ثقة

    return {
      averageDailyDemand: Math.ceil(averageDemand),
      safetyStock,
      recommendedReorderPoint: Math.ceil(averageDemand * 7 + safetyStock), // أسبوع من المخزون + مخزون الأمان
      recommendedMaxStock: Math.ceil(averageDemand * 14 + safetyStock), // أسبوعين من المخزون + مخزون الأمان
      historicalData: dailyDemand
    };
  }

  static async calculateSeasonalForecast(productId, warehouseId) {
    const now = new Date();
    const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));

    const orders = await Order.find({
      'items.product': productId,
      createdAt: { $gte: lastYear },
      status: 'completed'
    });

    // تجميع الطلبات حسب الشهر
    const monthlyDemand = new Array(12).fill(0);
    orders.forEach(order => {
      const month = order.createdAt.getMonth();
      const item = order.items.find(i => i.product.toString() === productId);
      if (item) {
        monthlyDemand[month] += item.quantity;
      }
    });

    // حساب معاملات الموسمية
    const averageMonthlyDemand = monthlyDemand.reduce((a, b) => a + b, 0) / 12;
    const seasonalFactors = monthlyDemand.map(demand => 
      averageMonthlyDemand > 0 ? demand / averageMonthlyDemand : 1
    );

    return {
      monthlyDemand,
      seasonalFactors,
      nextMonthForecast: Math.ceil(averageMonthlyDemand * seasonalFactors[new Date().getMonth()])
    };
  }

  static async optimizeInventoryLevels(warehouseId) {
    const warehouse = await Warehouse.findById(warehouseId).populate('inventory.product');
    if (!warehouse) {
      throw new Error('المستودع غير موجود');
    }

    const optimizationResults = [];

    for (const item of warehouse.inventory) {
      // حساب التنبؤات
      const demandForecast = await this.calculateDemandForecast(item.product._id, warehouseId);
      const seasonalForecast = await this.calculateSeasonalForecast(item.product._id, warehouseId);

      // تحديث مستويات المخزون المثالية
      const updates = {
        minStock: demandForecast.safetyStock,
        reorderPoint: demandForecast.recommendedReorderPoint,
        maxStock: demandForecast.recommendedMaxStock
      };

      // تحديث المستودع
      await Warehouse.updateOne(
        { 
          _id: warehouseId,
          'inventory.product': item.product._id
        },
        {
          $set: {
            'inventory.$.minStock': updates.minStock,
            'inventory.$.reorderPoint': updates.reorderPoint,
            'inventory.$.maxStock': updates.maxStock
          }
        }
      );

      // إنشاء تنبيه إذا كان المخزون الحالي أقل من نقطة إعادة الطلب
      if (item.quantity <= updates.reorderPoint) {
        await AlertService.createAlert({
          type: 'reorder_needed',
          title: 'يجب إعادة الطلب',
          message: `المنتج ${item.product.name} في المستودع ${warehouse.name} وصل إلى نقطة إعادة الطلب`,
          severity: 'warning',
          metadata: {
            productId: item.product._id,
            warehouseId: warehouse._id,
            currentStock: item.quantity,
            reorderPoint: updates.reorderPoint
          }
        });
      }

      optimizationResults.push({
        product: item.product.name,
        currentStock: item.quantity,
        updates,
        forecast: {
          dailyDemand: demandForecast.averageDailyDemand,
          nextMonthDemand: seasonalForecast.nextMonthForecast
        }
      });
    }

    return optimizationResults;
  }
}

module.exports = ForecastService;
