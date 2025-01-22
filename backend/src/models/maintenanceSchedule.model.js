const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HVACProduct',
    required: true
  },
  type: {
    type: String,
    enum: ['preventive', 'seasonal', 'warranty', 'custom'],
    required: true
  },
  frequency: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      required: true
    }
  },
  nextDate: {
    type: Date,
    required: true
  },
  checklist: [{
    task: String,
    required: Boolean,
    estimatedTime: Number // minutes
  }],
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    before: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days'],
        default: 'days'
      }
    },
    channels: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    }
  },
  history: [{
    date: Date,
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceReport'
    },
    status: {
      type: String,
      enum: ['completed', 'missed', 'rescheduled'],
      required: true
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

const sparePartSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  nameAr: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['ac', 'refrigeration', 'solar', 'inverter', 'battery', 'general'],
    required: true
  },
  compatibility: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HVACProduct'
    },
    models: [String]
  }],
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  stock: {
    quantity: {
      type: Number,
      default: 0
    },
    minQuantity: {
      type: Number,
      required: true
    },
    maxQuantity: {
      type: Number,
      required: true
    },
    location: {
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
      },
      section: String,
      shelf: String
    }
  },
  supplier: {
    name: String,
    code: String,
    leadTime: Number, // days
    price: Number
  },
  pricing: {
    cost: Number,
    markup: Number,
    price: Number,
    currency: {
      type: String,
      default: 'SYP'
    }
  },
  warranty: {
    duration: Number, // months
    terms: String
  },
  images: [{
    url: String,
    alt: String
  }],
  documents: [{
    type: String,
    url: String,
    name: String
  }],
  status: {
    type: String,
    enum: ['active', 'discontinued', 'out_of_stock'],
    default: 'active'
  }
}, {
  timestamps: true
});

const technicianRatingSchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    categories: {
      professionalism: Number,
      punctuality: Number,
      quality: Number,
      communication: Number
    }
  },
  comment: String,
  response: {
    text: String,
    date: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
maintenanceScheduleSchema.index({ nextDate: 1, status: 1 });
sparePartSchema.index({ code: 1 }, { unique: true });
sparePartSchema.index({ 'stock.quantity': 1 });
technicianRatingSchema.index({ technician: 1, createdAt: -1 });

// Methods
maintenanceScheduleSchema.methods.scheduleNext = function() {
  const { value, unit } = this.frequency;
  const date = new Date(this.nextDate);
  
  switch (unit) {
    case 'days':
      date.setDate(date.getDate() + value);
      break;
    case 'weeks':
      date.setDate(date.getDate() + (value * 7));
      break;
    case 'months':
      date.setMonth(date.getMonth() + value);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + value);
      break;
  }
  
  this.nextDate = date;
  return this.save();
};

sparePartSchema.methods.adjustStock = async function(quantity, type = 'out') {
  const newQuantity = type === 'in' ? 
    this.stock.quantity + quantity :
    this.stock.quantity - quantity;
    
  if (newQuantity < 0) {
    throw new Error('الكمية غير كافية في المخزون');
  }
  
  this.stock.quantity = newQuantity;
  if (newQuantity <= this.stock.minQuantity) {
    // Trigger low stock alert
  }
  
  return await this.save();
};

technicianRatingSchema.methods.calculateAverageRating = async function() {
  const categories = this.rating.categories;
  const values = Object.values(categories).filter(v => v);
  return values.reduce((a, b) => a + b, 0) / values.length;
};

// Statics
maintenanceScheduleSchema.statics.getDueMaintenances = function(date = new Date()) {
  return this.find({
    nextDate: { $lte: date },
    status: 'active'
  }).populate('customer product');
};

sparePartSchema.statics.getLowStock = function() {
  return this.find({
    'stock.quantity': { $lte: '$stock.minQuantity' },
    status: 'active'
  });
};

technicianRatingSchema.statics.getTechnicianAverageRating = async function(technicianId) {
  const result = await this.aggregate([
    { $match: { technician: technicianId, status: 'approved' } },
    { $group: {
      _id: null,
      averageRating: { $avg: '$rating.overall' },
      totalRatings: { $sum: 1 }
    }}
  ]);
  return result[0] || { averageRating: 0, totalRatings: 0 };
};

const MaintenanceSchedule = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
const SparePart = mongoose.model('SparePart', sparePartSchema);
const TechnicianRating = mongoose.model('TechnicianRating', technicianRatingSchema);

module.exports = {
  MaintenanceSchedule,
  SparePart,
  TechnicianRating
};
