const mongoose = require('mongoose');
const appConfig = require('../config/app.config');

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    product: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: Object.keys(appConfig.orders.statuses),
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: Object.keys(appConfig.orders.payment_statuses),
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  shortageAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  address: {
    street: String,
    building: String,
    floor: String,
    details: String,
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
    }
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  completedAt: Date,
  notes: String,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
orderSchema.index({ 'address.location': '2dsphere' });

// Calculate total amount before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => {
      item.totalPrice = item.quantity * item.pricePerUnit;
      return total + item.totalPrice;
    }, 0);
  }

  // Round total amount to nearest 50 SYP
  this.totalAmount = Math.round(this.totalAmount / 50) * 50;
  
  // Calculate shortage amount
  if (this.isModified('paidAmount')) {
    this.shortageAmount = Math.max(0, this.totalAmount - this.paidAmount);
    
    // Update payment status based on paid amount
    if (this.paidAmount === 0) {
      this.paymentStatus = 'pending';
    } else if (this.paidAmount < this.totalAmount) {
      this.paymentStatus = 'partially_paid';
    } else if (this.paidAmount === this.totalAmount) {
      this.paymentStatus = 'paid';
    } else {
      this.paymentStatus = 'shortage';
    }
  }

  next();
});

// Virtual for formatted amounts
orderSchema.virtual('formattedTotalAmount').get(function() {
  return `${this.totalAmount.toLocaleString('ar-SY')} ${appConfig.currency.symbol}`;
});

orderSchema.virtual('formattedPaidAmount').get(function() {
  return `${this.paidAmount.toLocaleString('ar-SY')} ${appConfig.currency.symbol}`;
});

orderSchema.virtual('formattedShortageAmount').get(function() {
  return `${this.shortageAmount.toLocaleString('ar-SY')} ${appConfig.currency.symbol}`;
});

// Get status in Arabic
orderSchema.virtual('statusAr').get(function() {
  return appConfig.orders.statuses[this.status];
});

// Get payment status in Arabic
orderSchema.virtual('paymentStatusAr').get(function() {
  return appConfig.orders.payment_statuses[this.paymentStatus];
});

module.exports = mongoose.model('Order', orderSchema);
