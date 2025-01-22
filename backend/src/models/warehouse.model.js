const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المستودع مطلوب'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'رمز المستودع مطلوب'],
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['main', 'production', 'distribution'],
    default: 'distribution'
  },
  location: {
    address: String,
    city: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'مدير المستودع مطلوب']
  },
  capacity: {
    water: {
      type: Number,
      required: true,
      min: 0
    },
    ice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  inventory: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    minStock: {
      type: Number,
      default: 10,
      min: 0
    },
    maxStock: {
      type: Number,
      required: true,
      min: 0
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: 0
    },
    barcode: String,
    location: {
      zone: String,
      rack: String,
      shelf: String
    }
  }],
  features: {
    hasRefrigeration: {
      type: Boolean,
      default: false
    },
    hasLoadingDock: {
      type: Boolean,
      default: true
    },
    hasGenerator: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// الفهرس الجغرافي
warehouseSchema.index({ 'location.coordinates': '2dsphere' });

// الفهارس الأخرى
warehouseSchema.index({ code: 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ 'inventory.product': 1 });
warehouseSchema.index({ 'inventory.barcode': 1 });

// النوع بالعربية
warehouseSchema.virtual('typeAr').get(function() {
  const types = {
    'main': 'رئيسي',
    'production': 'إنتاج',
    'distribution': 'توزيع'
  };
  return types[this.type];
});

// الحالة بالعربية
warehouseSchema.virtual('statusAr').get(function() {
  const statuses = {
    'active': 'نشط',
    'inactive': 'غير نشط',
    'maintenance': 'صيانة'
  };
  return statuses[this.status];
});

// حساب نسبة الإشغال
warehouseSchema.virtual('occupancyRate').get(function() {
  const waterOccupancy = this.inventory
    .filter(item => item.product.category === 'water')
    .reduce((sum, item) => sum + item.quantity, 0) / this.capacity.water * 100;
    
  const iceOccupancy = this.inventory
    .filter(item => item.product.category === 'ice')
    .reduce((sum, item) => sum + item.quantity, 0) / this.capacity.ice * 100;

  return {
    water: Math.round(waterOccupancy),
    ice: Math.round(iceOccupancy),
    total: Math.round((waterOccupancy + iceOccupancy) / 2)
  };
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
