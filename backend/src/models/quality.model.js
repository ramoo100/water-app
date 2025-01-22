const mongoose = require('mongoose');

const qualityCheckSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['water', 'ice', 'equipment', 'facility'],
    required: [true, 'نوع الفحص مطلوب']
  },
  checkNumber: {
    type: String,
    unique: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'المستودع مطلوب']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  parameters: [{
    name: {
      type: String,
      required: true
    },
    value: mongoose.Schema.Types.Mixed,
    unit: String,
    status: {
      type: String,
      enum: ['pass', 'fail', 'warning'],
      required: true
    },
    acceptableRange: {
      min: Number,
      max: Number
    },
    notes: String
  }],
  overallStatus: {
    type: String,
    enum: ['pass', 'fail', 'warning'],
    required: true
  },
  inspector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  attachments: [{
    type: String,
    filename: String,
    url: String
  }],
  notes: String
}, {
  timestamps: true
});

const maintenanceRecordSchema = new mongoose.Schema({
  equipment: {
    type: String,
    required: [true, 'المعدات مطلوبة']
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'المستودع مطلوب']
  },
  type: {
    type: String,
    enum: ['preventive', 'corrective', 'calibration'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completionDate: Date,
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cost: {
    amount: Number,
    currency: {
      type: String,
      default: 'SYP'
    }
  },
  parts: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  issues: [{
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    status: {
      type: String,
      enum: ['open', 'resolved']
    }
  }],
  recommendations: [String],
  attachments: [{
    type: String,
    filename: String,
    url: String
  }],
  notes: String
}, {
  timestamps: true
});

// إنشاء رقم فحص فريد
qualityCheckSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.checkNumber = `QC${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// النوع بالعربية
qualityCheckSchema.virtual('typeAr').get(function() {
  const types = {
    'water': 'مياه',
    'ice': 'ثلج',
    'equipment': 'معدات',
    'facility': 'منشأة'
  };
  return types[this.type];
});

// الحالة بالعربية
qualityCheckSchema.virtual('statusAr').get(function() {
  const statuses = {
    'pass': 'ناجح',
    'fail': 'راسب',
    'warning': 'تحذير'
  };
  return statuses[this.overallStatus];
});

// نوع الصيانة بالعربية
maintenanceRecordSchema.virtual('typeAr').get(function() {
  const types = {
    'preventive': 'وقائية',
    'corrective': 'تصحيحية',
    'calibration': 'معايرة'
  };
  return types[this.type];
});

// حالة الصيانة بالعربية
maintenanceRecordSchema.virtual('statusAr').get(function() {
  const statuses = {
    'scheduled': 'مجدولة',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتملة',
    'cancelled': 'ملغاة'
  };
  return statuses[this.status];
});

const QualityCheck = mongoose.model('QualityCheck', qualityCheckSchema);
const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);

module.exports = {
  QualityCheck,
  MaintenanceRecord
};
