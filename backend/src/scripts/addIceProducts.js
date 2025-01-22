require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product.model');

const iceProducts = [
  {
    name: 'مكعبات ثلج نقية - 2 كيلو',
    description: 'مكعبات ثلج نقية وشفافة، مثالية للمشروبات والحفلات. عبوة 2 كيلو غرام.',
    price: 5000, // 5,000 SYP
    size: 2,
    unit: 'kg',
    category: 'ice',
    isAvailable: true,
    stock: 100
  },
  {
    name: 'مكعبات ثلج نقية - 5 كيلو',
    description: 'مكعبات ثلج نقية وشفافة، مثالية للمشروبات والحفلات. عبوة 5 كيلو غرام.',
    price: 11000, // 11,000 SYP
    size: 5,
    unit: 'kg',
    category: 'ice',
    isAvailable: true,
    stock: 75
  },
  {
    name: 'مكعبات ثلج نقية - 10 كيلو',
    description: 'مكعبات ثلج نقية وشفافة، مثالية للمشروبات والحفلات. عبوة 10 كيلو غرام.',
    price: 20000, // 20,000 SYP
    size: 10,
    unit: 'kg',
    category: 'ice',
    isAvailable: true,
    stock: 50
  }
];

async function addIceProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-delivery');
    console.log('متصل بقاعدة البيانات');

    // Delete existing ice products
    await Product.deleteMany({ category: 'ice' });
    console.log('تم حذف منتجات الثلج القديمة');

    // Add new ice products
    const products = await Product.create(iceProducts);
    console.log('تم إضافة منتجات الثلج الجديدة:');
    products.forEach(product => {
      console.log(`- ${product.name}: ${product.formattedPrice}`);
    });

    mongoose.disconnect();
    console.log('تم قطع الاتصال بقاعدة البيانات');
  } catch (error) {
    console.error('حدث خطأ:', error);
    process.exit(1);
  }
}

addIceProducts();
