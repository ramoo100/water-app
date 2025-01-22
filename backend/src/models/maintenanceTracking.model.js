const mongoose = require('mongoose');

const technicianLocationSchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  currentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest'
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  }
});

const maintenanceReportSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  diagnosis: {
    issue: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['mechanical', 'electrical', 'software', 'other'],
      required: true
    },
    severity: {
      type: String,
      enum: ['critical', 'major', 'minor', 'normal'],
      required: true
    }
  },
  actions: [{
    type: String,
    description: String,
    time: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  }],
  partsUsed: [{
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart'
    },
    quantity: Number,
    cost: Number,
    warranty: {
      duration: Number, // months
      terms: String
    }
  }],
  tests: [{
    name: String,
    result: {
      type: String,
      enum: ['pass', 'fail', 'warning']
    },
    notes: String
  }],
  recommendations: [{
    type: String,
    priority: {
      type: String,
      enum: ['urgent', 'recommended', 'optional']
    },
    deadline: Date
  }],
  images: [{
    url: String,
    description: String,
    timestamp: Date
  }],
  signature: {
    customer: String,
    technician: String,
    timestamp: Date
  },
  followUp: {
    required: Boolean,
    date: Date,
    notes: String
  }
}, {
  timestamps: true
});

const warrantySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HVACProduct',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'extended', 'premium'],
    default: 'standard'
  },
  coverage: [{
    item: String,
    duration: Number, // months
    terms: String
  }],
  claims: [{
    date: Date,
    issue: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    maintenanceReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceReport'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'void'],
    default: 'active'
  }
});

const invoiceSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  number: {
    type: String,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  items: [{
    type: {
      type: String,
      enum: ['service', 'part', 'warranty'],
      required: true
    },
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    warranty: Boolean
  }],
  subtotal: Number,
  tax: Number,
  discount: {
    amount: Number,
    reason: String
  },
  total: Number,
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed'],
      default: 'pending'
    },
    transactions: [{
      date: Date,
      amount: Number,
      reference: String
    }]
  },
  notes: String,
  terms: [String]
}, {
  timestamps: true
});

// Indexes
technicianLocationSchema.index({ location: '2dsphere' });
warrantySchema.index({ serialNumber: 1 }, { unique: true });
invoiceSchema.index({ number: 1 }, { unique: true });

// Pre-save hooks
invoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.number = `INV${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// Methods
technicianLocationSchema.methods.updateLocation = async function(coordinates) {
  this.location.coordinates = coordinates;
  this.lastUpdate = new Date();
  return await this.save();
};

maintenanceReportSchema.methods.addAction = async function(action) {
  this.actions.push({
    ...action,
    time: new Date()
  });
  return await this.save();
};

warrantySchema.methods.addClaim = async function(claim) {
  if (this.status !== 'active') {
    throw new Error('الضمان غير فعال');
  }
  this.claims.push({
    ...claim,
    date: new Date()
  });
  return await this.save();
};

// Statics
technicianLocationSchema.statics.findNearbyTechnicians = function(coordinates, maxDistance) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'available'
  }).populate('technician');
};

const TechnicianLocation = mongoose.model('TechnicianLocation', technicianLocationSchema);
const MaintenanceReport = mongoose.model('MaintenanceReport', maintenanceReportSchema);
const Warranty = mongoose.model('Warranty', warrantySchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = {
  TechnicianLocation,
  MaintenanceReport,
  Warranty,
  Invoice
};
