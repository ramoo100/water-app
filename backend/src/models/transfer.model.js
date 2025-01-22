const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    unique: true,
    required: true
  },
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'المستودع المصدر مطلوب']
  },
  destinationWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'المستودع الوجهة مطلوب']
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'الكمية يجب أن تكون أكبر من صفر']
    },
    sourceBarcode: String,
    destinationBarcode: String,
    status: {
      type: String,
      enum: ['pending', 'picked', 'in_transit', 'received', 'stored'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  vehicle: {
    type: String,
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: Date,
  completionTime: Date,
  notes: String,
  attachments: [{
    type: String,
    filename: String,
    url: String
  }],
  tracking: [{
    status: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// إنشاء رقم تحويل فريد
transferSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.transferNumber = `TRF${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// الحالة بالعربية
transferSchema.virtual('statusAr').get(function() {
  const statusMap = {
    'draft': 'مسودة',
    'confirmed': 'مؤكد',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  };
  return statusMap[this.status];
});

// الأولوية بالعربية
transferSchema.virtual('priorityAr').get(function() {
  const priorityMap = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة'
  };
  return priorityMap[this.priority];
});

// حساب المدة المستغرقة
transferSchema.virtual('duration').get(function() {
  if (this.startTime && this.completionTime) {
    return (this.completionTime - this.startTime) / (1000 * 60); // بالدقائق
  }
  return null;
});

// الفهارس
transferSchema.index({ transferNumber: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ priority: 1 });
transferSchema.index({ scheduledDate: 1 });
transferSchema.index({ 'tracking.location': '2dsphere' });

module.exports = mongoose.model('Transfer', transferSchema);
