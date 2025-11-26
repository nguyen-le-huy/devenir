import mongoose from 'mongoose';
import Product from '../models/ProductModel.js';
import dotenv from 'dotenv';

dotenv.config();

const testQuery = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const sweatersCategoryId = '692545b46fdb84b11812678b';

    // Test 1: Query với string (như backend đang làm - SAI)
    console.log('🔴 Test 1: Query với category là STRING:');
    const productsWithString = await Product.find({ category: sweatersCategoryId }).lean();
    console.log(`   Found: ${productsWithString.length} products\n`);

    // Test 2: Query với ObjectId (ĐÚNG)
    console.log('🟢 Test 2: Query với category là ObjectId:');
    const productsWithObjectId = await Product.find({ 
      category: new mongoose.Types.ObjectId(sweatersCategoryId) 
    }).lean();
    console.log(`   Found: ${productsWithObjectId.length} products`);
    productsWithObjectId.forEach(p => console.log(`   - ${p.name}`));

    // Test 3: Check kiểu dữ liệu của category field
    console.log('\n📊 Sample product category field type:');
    const sample = await Product.findOne().lean();
    if (sample) {
      console.log(`   Product: ${sample.name}`);
      console.log(`   Category value: ${sample.category}`);
      console.log(`   Category type: ${typeof sample.category}`);
      console.log(`   Is ObjectId: ${sample.category instanceof mongoose.Types.ObjectId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testQuery();
