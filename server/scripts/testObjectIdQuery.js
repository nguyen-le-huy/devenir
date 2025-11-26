import mongoose from 'mongoose';
import Product from '../models/ProductModel.js';
import dotenv from 'dotenv';

dotenv.config();

const testQueryWithObjectId = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const scarvesId = '69253e8a6fdb84b118126771';

    console.log('🧪 Testing Query Methods:');
    console.log('='.repeat(60));

    // Method 1: String (old way - doesn't work with ObjectId schema)
    console.log('\n1️⃣ Query with STRING:');
    const withString = await Product.find({ 
      category: scarvesId,
      isActive: true 
    }).lean();
    console.log(`   Found: ${withString.length} products`);

    // Method 2: new mongoose.Types.ObjectId (correct way)
    console.log('\n2️⃣ Query with ObjectId:');
    const withObjectId = await Product.find({ 
      category: new mongoose.Types.ObjectId(scarvesId),
      isActive: true 
    }).lean();
    console.log(`   Found: ${withObjectId.length} products`);
    withObjectId.forEach(p => console.log(`   - ${p.name}`));

    console.log('\n' + '='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testQueryWithObjectId();
