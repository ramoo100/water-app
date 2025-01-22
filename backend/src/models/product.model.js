const mongoose = require('mongoose');
const appConfig = require('../config/app.config');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المنتج مطلوب'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'وصف المنتج مطلوب']
  },
  price: {
    type: Number,
    required: [true, 'سعر المنتج مطلوب'],
    min: [0, 'السعر يجب أن يكون أكبر من صفر']
  },
  size: {
    type: Number,
    required: [true, 'حجم العبوة مطلوب'],
    min: [0, 'الحجم يجب أن يكون أكبر من صفر']
  },
  unit: {
    type: String,
    enum: ['liter', 'gallon', 'kg'],
    default: 'liter'
  },
  category: {
    type: String,
    enum: ['water', 'ice'],
    required: [true, 'نوع المنتج مطلوب']
  },
  image: {
    type: String,
    default: function() {
      return this.category === 'ice' ? 'default-ice.png' : 'default-bottle.png';
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'المخزون لا يمكن أن يكون سالب']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `${this.price.toLocaleString('ar-SY')} ${appConfig.currency.symbol}`;
});

// Virtual for formatted size
productSchema.virtual('formattedSize').get(function() {
  const unitMap = {
    'liter': 'لتر',
    'gallon': 'جالون',
    'kg': 'كيلو غرام'
  };
  return `${this.size} ${unitMap[this.unit]}`;
});

// Virtual for category in Arabic
productSchema.virtual('categoryAr').get(function() {
  const categoryMap = {
    'water': 'مياه',
    'ice': 'ثلج'
  };
  return categoryMap[this.category];
});

module.exports = mongoose.model('Product', productSchema);
