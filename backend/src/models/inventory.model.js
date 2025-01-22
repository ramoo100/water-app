const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'المنتج مطلوب']
  },
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment'],
    required: [true, 'نوع الحركة مطلوب']
  },
  quantity: {
    type: Number,
    required: [true, 'الكمية مطلوبة'],
    validate: {
      validator: function(v) {
        // Allow negative quantities only for adjustments
        return this.type === 'adjustment' ? true : v > 0;
      },
      message: 'الكمية يجب أن تكون أكبر من صفر'
    }
  },
  reason: {
    type: String,
    required: [true, 'سبب الحركة مطلوب']
  },
  reference: {
    type: String,
    enum: ['production', 'order', 'damage', 'expiry', 'other'],
    required: [true, 'مرجع الحركة مطلوب']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Production', 'StockCount']
  },
  notes: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'منفذ الحركة مطلوب']
  }
}, {
  timestamps: true
});

const stockCountSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'المنتج مطلوب']
  },
  expectedQuantity: {
    type: Number,
    required: [true, 'الكمية المتوقعة مطلوبة']
  },
  actualQuantity: {
    type: Number,
    required: [true, 'الكمية الفعلية مطلوبة']
  },
  difference: {
    type: Number,
    default: function() {
      return this.actualQuantity - this.expectedQuantity;
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: String,
  countedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'القائم بالجرد مطلوب']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const productionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'المنتج مطلوب']
  },
  quantity: {
    type: Number,
    required: [true, 'الكمية مطلوبة'],
    min: [1, 'الكمية يجب أن تكون أكبر من صفر']
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  startDate: {
    type: Date,
    required: [true, 'تاريخ البدء مطلوب']
  },
  completionDate: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'منشئ الإنتاج مطلوب']
  }
}, {
  timestamps: true
});

// Virtual for status in Arabic
productionSchema.virtual('statusAr').get(function() {
  const statusMap = {
    'planned': 'مخطط',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  };
  return statusMap[this.status];
});

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
const StockCount = mongoose.model('StockCount', stockCountSchema);
const Production = mongoose.model('Production', productionSchema);

module.exports = {
  InventoryTransaction,
  StockCount,
  Production
};
