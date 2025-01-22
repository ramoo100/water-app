const mongoose = require('mongoose');

const cashShortageSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  expectedAmount: {
    type: Number,
    required: true
  },
  actualAmount: {
    type: Number,
    required: true
  },
  shortageAmount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'deducted'],
    default: 'pending'
  },
  resolution: {
    type: String,
    enum: ['paid', 'deducted', 'waived'],
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  notes: String,
  relatedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }]
}, {
  timestamps: true
});

// Calculate shortage amount before saving
cashShortageSchema.pre('save', function(next) {
  this.shortageAmount = this.expectedAmount - this.actualAmount;
  next();
});

module.exports = mongoose.model('CashShortage', cashShortageSchema);
