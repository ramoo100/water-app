const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');

class BarcodeService {
  static generateBarcode(prefix, id) {
    // تحويل الـ ID إلى رقم من 6 خانات
    const paddedId = id.toString().padStart(6, '0');
    // إضافة رقم التحقق
    const fullCode = `${prefix}${paddedId}`;
    const checkDigit = this.calculateCheckDigit(fullCode);
    return `${fullCode}${checkDigit}`;
  }

  static calculateCheckDigit(code) {
    // حساب رقم التحقق باستخدام خوارزمية Modulo 10
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i]);
      if (i % 2 === 0) {
        sum += digit * 3;
      } else {
        sum += digit;
      }
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  static validateBarcode(barcode) {
    if (!/^\d{10}$/.test(barcode)) {
      return false;
    }
    const code = barcode.slice(0, -1);
    const checkDigit = parseInt(barcode.slice(-1));
    return this.calculateCheckDigit(code) === checkDigit;
  }

  static async generateProductBarcode(productId, warehouseId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('المنتج غير موجود');
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      throw new Error('المستودع غير موجود');
    }

    // إنشاء باركود فريد
    const prefix = product.category === 'water' ? '20' : '21';
    const barcode = this.generateBarcode(prefix, product._id.toString().slice(-6));

    // تحديث المستودع بالباركود الجديد
    await Warehouse.updateOne(
      {
        _id: warehouseId,
        'inventory.product': productId
      },
      {
        $set: {
          'inventory.$.barcode': barcode
        }
      }
    );

    return {
      barcode,
      product: {
        id: product._id,
        name: product.name,
        category: product.category
      },
      warehouse: {
        id: warehouse._id,
        name: warehouse.name,
        code: warehouse.code
      }
    };
  }

  static async getProductByBarcode(barcode, warehouseId) {
    if (!this.validateBarcode(barcode)) {
      throw new Error('الباركود غير صالح');
    }

    const warehouse = await Warehouse.findById(warehouseId)
      .populate('inventory.product');

    if (!warehouse) {
      throw new Error('المستودع غير موجود');
    }

    const inventoryItem = warehouse.inventory.find(item => item.barcode === barcode);
    if (!inventoryItem) {
      throw new Error('المنتج غير موجود في هذا المستودع');
    }

    return {
      product: inventoryItem.product,
      quantity: inventoryItem.quantity,
      location: inventoryItem.location,
      warehouse: {
        id: warehouse._id,
        name: warehouse.name,
        code: warehouse.code
      }
    };
  }

  static async scanBarcode(barcode, warehouseId, action, quantity = 1) {
    const productInfo = await this.getProductByBarcode(barcode, warehouseId);
    
    // تحديث المخزون بناءً على الإجراء
    let update = {};
    if (action === 'in') {
      update = { $inc: { 'inventory.$.quantity': quantity } };
    } else if (action === 'out') {
      if (productInfo.quantity < quantity) {
        throw new Error('الكمية المطلوبة غير متوفرة في المخزون');
      }
      update = { $inc: { 'inventory.$.quantity': -quantity } };
    }

    await Warehouse.updateOne(
      {
        _id: warehouseId,
        'inventory.barcode': barcode
      },
      update
    );

    return {
      success: true,
      message: `تم ${action === 'in' ? 'إضافة' : 'سحب'} ${quantity} من المنتج`,
      product: productInfo.product.name,
      newQuantity: action === 'in' ? 
        productInfo.quantity + quantity : 
        productInfo.quantity - quantity
    };
  }

  static async generateBarcodeLabels(productId, warehouseId, quantity = 1) {
    const barcodeInfo = await this.generateProductBarcode(productId, warehouseId);
    
    return {
      barcode: barcodeInfo.barcode,
      product: barcodeInfo.product,
      warehouse: barcodeInfo.warehouse,
      quantity,
      labels: Array(quantity).fill({
        barcode: barcodeInfo.barcode,
        productName: barcodeInfo.product.name,
        warehouseCode: barcodeInfo.warehouse.code,
        date: new Date().toISOString().split('T')[0]
      })
    };
  }
}

module.exports = BarcodeService;
