import mongoose from 'mongoose';
import Product from '../models/ProductModel.js';
import dotenv from 'dotenv';

dotenv.config();

const inspectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get raw data from MongoDB
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    const sample = await productsCollection.findOne({});
    
    console.log('📦 Raw MongoDB Document:');
    console.log(JSON.stringify(sample, null, 2));
    
    console.log('\n🔍 Category Field Analysis:');
    console.log('  Type:', typeof sample.category);
    console.log('  Value:', sample.category);
    console.log('  Constructor:', sample.category?.constructor?.name);

    // Count by different category values
    console.log('\n📊 Products by Category (raw ObjectId):');
    const pipeline = [
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];
    const categoryGroups = await productsCollection.aggregate(pipeline).toArray();
    categoryGroups.forEach(g => {
      console.log(`  ${g._id}: ${g.count} products`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

inspectDatabase();
