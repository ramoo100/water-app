const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['ac', 'refrigeration', 'solar', 'inverter', 'battery'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  nameAr: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  specifications: {
    // مواصفات التكييف
    ac: {
      capacity: Number, // BTU
      type: String, // split, window, central
      energyEfficiency: String, // A++, A+, A, B
      refrigerant: String,
      features: [String]
    },
    // مواصفات التبريد
    refrigeration: {
      capacity: Number,
      type: String,
      temperature: {
        min: Number,
        max: Number
      },
      features: [String]
    },
    // مواصفات الطاقة الشمسية
    solar: {
      power: Number, // Watts
      type: String, // Mono, Poly
      efficiency: Number,
      warranty: Number // years
    },
    // مواصفات الإنفيرتر
    inverter: {
      power: Number, // Watts
      voltage: {
        input: String,
        output: String
      },
      efficiency: Number,
      features: [String]
    },
    // مواصفات البطاريات
    battery: {
      capacity: Number, // Ah
      voltage: Number,
      type: String,
      lifecycle: Number,
      warranty: Number
    }
  },
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'SYP'
    }
  },
  installation: {
    included: Boolean,
    cost: Number
  },
  warranty: {
    duration: Number, // months
    type: String,
    terms: [String]
  },
  stock: {
    available: Number,
    reserved: Number,
    minimum: Number
  },
  images: [{
    url: String,
    alt: String
  }],
  documents: [{
    type: String, // manual, datasheet, certificate
    url: String,
    name: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  }
}, {
  timestamps: true
});

const maintenanceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HVACProduct'
  },
  type: {
    type: String,
    enum: ['installation', 'repair', 'maintenance', 'consultation'],
    required: true
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal'
  },
  description: {
    type: String,
    required: true
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  preferredDate: {
    type: Date,
    required: true
  },
  alternativeDate: Date,
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  diagnosis: {
    issue: String,
    recommendations: [String],
    parts: [{
      name: String,
      quantity: Number,
      price: Number
    }]
  },
  cost: {
    labor: Number,
    parts: Number,
    total: Number,
    currency: {
      type: String,
      default: 'SYP'
    }
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  attachments: [{
    type: String,
    url: String,
    name: String
  }]
}, {
  timestamps: true
});

// Virtuals
productSchema.virtual('stockStatus').get(function() {
  if (this.stock.available <= this.stock.minimum) return 'low';
  if (this.stock.available === 0) return 'out_of_stock';
  return 'in_stock';
});

// Methods
productSchema.methods.reserve = async function(quantity) {
  if (this.stock.available >= quantity) {
    this.stock.available -= quantity;
    this.stock.reserved += quantity;
    return await this.save();
  }
  throw new Error('المنتج غير متوفر بالكمية المطلوبة');
};

maintenanceRequestSchema.methods.assign = async function(technicianId) {
  this.technician = technicianId;
  this.status = 'confirmed';
  return await this.save();
};

maintenanceRequestSchema.methods.complete = async function(diagnosisData) {
  this.status = 'completed';
  this.diagnosis = diagnosisData;
  this.cost.total = this.cost.labor + this.cost.parts;
  return await this.save();
};

// Statics
productSchema.statics.getAvailableProducts = function(category) {
  return this.find({
    category,
    status: 'active',
    'stock.available': { $gt: 0 }
  });
};

maintenanceRequestSchema.statics.getPendingRequests = function() {
  return this.find({
    status: 'pending'
  }).populate('customer product');
};

const HVACProduct = mongoose.model('HVACProduct', productSchema);
const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

module.exports = {
  HVACProduct,
  MaintenanceRequest
};
