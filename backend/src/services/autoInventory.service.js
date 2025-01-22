const Warehouse = require('../models/warehouse.model');
const { StockCount } = require('../models/inventory.model');
const AlertService = require('./alert.service');
const BarcodeService = require('./barcode.service');

class AutoInventoryService {
  static async scheduleInventoryCount(warehouseId, scheduledDate) {
    const warehouse = await Warehouse.findById(warehouseId).populate('inventory.product');
    if (!warehouse) {
      throw new Error('المستودع غير موجود');
    }

    // إنشاء مهمة جرد جديدة
    const stockCount = await StockCount.create({
      warehouse: warehouseId,
      scheduledDate,
      status: 'scheduled',
      items: warehouse.inventory.map(item => ({
        product: item.product._id,
        expectedQuantity: item.quantity,
        location: item.location
      }))
    });

    // إنشاء تنبيه للجرد المجدول
    await AlertService.createAlert({
      type: 'inventory_count_scheduled',
      title: 'جرد مجدول',
      message: `تم جدولة جرد للمستودع ${warehouse.name} في ${scheduledDate}`,
      severity: 'info',
      metadata: {
        warehouseId,
        stockCountId: stockCount._id,
        scheduledDate
      }
    });

    return stockCount;
  }

  static async startAutomatedCount(stockCountId) {
    const stockCount = await StockCount.findById(stockCountId)
      .populate('warehouse')
      .populate('items.product');
    
    if (!stockCount) {
      throw new Error('الجرد غير موجود');
    }

    // تحديث حالة الجرد
    stockCount.status = 'in_progress';
    stockCount.startTime = new Date();
    await stockCount.save();

    // محاكاة عملية الجرد الآلي
    const results = [];
    for (const item of stockCount.items) {
      // قراءة الباركود
      const scannedInfo = await BarcodeService.getProductByBarcode(
        item.product.barcode,
        stockCount.warehouse._id
      );

      // مقارنة الكمية المتوقعة مع الفعلية
      const difference = scannedInfo.quantity - item.expectedQuantity;
      
      results.push({
        product: item.product._id,
        expectedQuantity: item.expectedQuantity,
        actualQuantity: scannedInfo.quantity,
        difference,
        location: scannedInfo.location
      });

      // إنشاء تنبيه إذا كان هناك فرق
      if (difference !== 0) {
        await AlertService.createAlert({
          type: 'inventory_discrepancy',
          title: 'فرق في الجرد',
          message: `تم اكتشاف فرق في كمية ${item.product.name}`,
          severity: 'warning',
          metadata: {
            productId: item.product._id,
            warehouseId: stockCount.warehouse._id,
            expected: item.expectedQuantity,
            actual: scannedInfo.quantity,
            difference
          }
        });
      }
    }

    // تحديث نتائج الجرد
    stockCount.results = results;
    stockCount.status = 'completed';
    stockCount.completionTime = new Date();
    await stockCount.save();

    // إنشاء تقرير الجرد
    const report = await this.generateInventoryReport(stockCount._id);

    return {
      stockCount,
      report
    };
  }

  static async generateInventoryReport(stockCountId) {
    const stockCount = await StockCount.findById(stockCountId)
      .populate('warehouse')
      .populate('items.product');

    if (!stockCount) {
      throw new Error('الجرد غير موجود');
    }

    // تحليل النتائج
    const analysis = {
      totalItems: stockCount.items.length,
      matchingItems: 0,
      discrepancies: 0,
      totalDifference: 0,
      categories: {},
      locations: {}
    };

    for (const item of stockCount.results) {
      // إحصائيات عامة
      if (item.difference === 0) {
        analysis.matchingItems++;
      } else {
        analysis.discrepancies++;
        analysis.totalDifference += Math.abs(item.difference);
      }

      // تحليل حسب الفئة
      const category = item.product.category;
      if (!analysis.categories[category]) {
        analysis.categories[category] = {
          count: 0,
          discrepancies: 0,
          totalDifference: 0
        };
      }
      analysis.categories[category].count++;
      if (item.difference !== 0) {
        analysis.categories[category].discrepancies++;
        analysis.categories[category].totalDifference += Math.abs(item.difference);
      }

      // تحليل حسب الموقع
      const location = `${item.location.zone}-${item.location.rack}-${item.location.shelf}`;
      if (!analysis.locations[location]) {
        analysis.locations[location] = {
          count: 0,
          discrepancies: 0,
          totalDifference: 0
        };
      }
      analysis.locations[location].count++;
      if (item.difference !== 0) {
        analysis.locations[location].discrepancies++;
        analysis.locations[location].totalDifference += Math.abs(item.difference);
      }
    }

    // حساب النسب المئوية
    analysis.accuracy = (analysis.matchingItems / analysis.totalItems) * 100;
    analysis.discrepancyRate = (analysis.discrepancies / analysis.totalItems) * 100;

    return {
      stockCount: {
        id: stockCount._id,
        warehouse: stockCount.warehouse.name,
        date: stockCount.startTime,
        duration: (stockCount.completionTime - stockCount.startTime) / (1000 * 60) // بالدقائق
      },
      analysis,
      recommendations: this.generateRecommendations(analysis)
    };
  }

  static generateRecommendations(analysis) {
    const recommendations = [];

    // توصيات عامة
    if (analysis.accuracy < 95) {
      recommendations.push({
        type: 'general',
        priority: 'high',
        message: 'يجب مراجعة إجراءات إدارة المخزون لتحسين الدقة'
      });
    }

    // توصيات حسب الفئة
    for (const [category, data] of Object.entries(analysis.categories)) {
      const discrepancyRate = (data.discrepancies / data.count) * 100;
      if (discrepancyRate > 10) {
        recommendations.push({
          type: 'category',
          category,
          priority: 'medium',
          message: `مراجعة إجراءات التخزين لفئة ${category}`
        });
      }
    }

    // توصيات حسب الموقع
    for (const [location, data] of Object.entries(analysis.locations)) {
      const discrepancyRate = (data.discrepancies / data.count) * 100;
      if (discrepancyRate > 15) {
        recommendations.push({
          type: 'location',
          location,
          priority: 'high',
          message: `تحسين تنظيم الموقع ${location}`
        });
      }
    }

    return recommendations;
  }
}

module.exports = AutoInventoryService;
