const { InventoryTransaction, StockCount, Production } = require('../models/inventory.model');
const Product = require('../models/product.model');
const AlertService = require('./alert.service');

class InventoryService {
  // إدارة المخزون
  static async adjustStock(productId, quantity, type, reason, reference, referenceId, referenceModel, performedBy, notes = '') {
    const session = await InventoryTransaction.startSession();
    session.startTransaction();

    try {
      // تحديث المخزون
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('المنتج غير موجود');
      }

      // حساب الكمية الجديدة
      let newStock = product.stock;
      if (type === 'in') {
        newStock += quantity;
      } else if (type === 'out') {
        if (product.stock < quantity) {
          throw new Error('الكمية المطلوبة غير متوفرة في المخزون');
        }
        newStock -= quantity;
      } else if (type === 'adjustment') {
        newStock = quantity;
      }

      // تحديث المخزون
      await Product.findByIdAndUpdate(productId, { stock: newStock });

      // تسجيل حركة المخزون
      const transaction = await InventoryTransaction.create([{
        product: productId,
        type,
        quantity,
        reason,
        reference,
        referenceId,
        referenceModel,
        performedBy,
        notes
      }], { session });

      // التحقق من المخزون المنخفض
      if (newStock <= product.minStock) {
        await AlertService.createAlert({
          type: 'low_stock',
          title: 'تنبيه: مخزون منخفض',
          message: `المنتج ${product.name} وصل إلى مستوى منخفض (${newStock} ${product.unit})`,
          severity: 'warning',
          metadata: {
            productId: product._id,
            currentStock: newStock,
            minStock: product.minStock
          }
        });
      }

      await session.commitTransaction();
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // إدارة الإنتاج
  static async createProduction(data) {
    const production = await Production.create(data);
    
    // إنشاء تنبيه للإنتاج الجديد
    await AlertService.createAlert({
      type: 'production_created',
      title: 'إنتاج جديد',
      message: `تم إنشاء أمر إنتاج جديد: ${production._id}`,
      severity: 'info',
      metadata: {
        productionId: production._id,
        productId: production.product,
        quantity: production.quantity
      }
    });

    return production;
  }

  static async updateProductionStatus(productionId, status, completionDate = null) {
    const production = await Production.findById(productionId);
    if (!production) {
      throw new Error('الإنتاج غير موجود');
    }

    if (status === 'completed' && !completionDate) {
      completionDate = new Date();
    }

    const updatedProduction = await Production.findByIdAndUpdate(
      productionId,
      { status, completionDate },
      { new: true }
    );

    if (status === 'completed') {
      // إضافة المنتجات إلى المخزون
      await this.adjustStock(
        production.product,
        production.quantity,
        'in',
        'إنتاج جديد',
        'production',
        production._id,
        'Production',
        production.createdBy
      );
    }

    return updatedProduction;
  }

  // جرد المخزون
  static async createStockCount(data) {
    const stockCount = await StockCount.create(data);
    
    // إذا كان هناك فرق في الجرد
    if (stockCount.difference !== 0) {
      await AlertService.createAlert({
        type: 'stock_count_difference',
        title: 'فرق في الجرد',
        message: `تم اكتشاف فرق في جرد المنتج ${stockCount.product}`,
        severity: 'warning',
        metadata: {
          stockCountId: stockCount._id,
          productId: stockCount.product,
          difference: stockCount.difference
        }
      });
    }

    return stockCount;
  }

  static async approveStockCount(stockCountId, approvedBy) {
    const stockCount = await StockCount.findById(stockCountId);
    if (!stockCount) {
      throw new Error('الجرد غير موجود');
    }

    if (stockCount.status !== 'pending') {
      throw new Error('لا يمكن اعتماد هذا الجرد');
    }

    // تحديث المخزون بناءً على الجرد
    await this.adjustStock(
      stockCount.product,
      stockCount.actualQuantity,
      'adjustment',
      'تعديل بناءً على الجرد',
      'stockCount',
      stockCount._id,
      'StockCount',
      approvedBy
    );

    return await StockCount.findByIdAndUpdate(
      stockCountId,
      {
        status: 'approved',
        approvedBy
      },
      { new: true }
    );
  }

  // تقارير المخزون
  static async getInventoryReport(filters = {}) {
    const products = await Product.find(filters).select('name unit stock category');
    const report = {
      totalProducts: products.length,
      byCategory: {},
      lowStock: []
    };

    for (const product of products) {
      // تجميع حسب الفئة
      if (!report.byCategory[product.category]) {
        report.byCategory[product.category] = {
          count: 0,
          totalStock: 0
        };
      }
      report.byCategory[product.category].count++;
      report.byCategory[product.category].totalStock += product.stock;

      // المنتجات ذات المخزون المنخفض
      if (product.stock <= (product.minStock || 10)) {
        report.lowStock.push({
          id: product._id,
          name: product.name,
          stock: product.stock,
          unit: product.unit
        });
      }
    }

    return report;
  }

  static async getTransactionHistory(productId, startDate, endDate) {
    const query = {};
    if (productId) query.product = productId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await InventoryTransaction.find(query)
      .populate('product', 'name unit')
      .populate('performedBy', 'name')
      .sort('-createdAt');
  }
}

module.exports = InventoryService;
