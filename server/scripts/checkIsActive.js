import mongoose from 'mongoose';
import Product from '../models/ProductModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkIsActive = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const all = await Product.countDocuments({});
    const active = await Product.countDocuments({ isActive: true });
    const inactive = await Product.countDocuments({ isActive: false });
    const noField = await Product.countDocuments({ isActive: { $exists: false } });

    console.log('📊 Product Status Summary:');
    console.log('='.repeat(50));
    console.log(`Total products:        ${all}`);
    console.log(`isActive = true:       ${active}`);
    console.log(`isActive = false:      ${inactive}`);
    console.log(`No isActive field:     ${noField}`);
    console.log('='.repeat(50));

    // Check sample products
    const samples = await Product.find({}).limit(5).lean();
    console.log('\n📦 Sample Products:');
    samples.forEach(p => {
      console.log(`\n  Name: ${p.name}`);
      console.log(`  Category: ${p.category}`);
      console.log(`  isActive: ${p.isActive}`);
      console.log(`  Status: ${p.status || 'N/A'}`);
    });

    // Check Scarves category specifically
    const scarvesId = '69253e8a6fdb84b118126771';
    console.log(`\n\n🔍 Scarves Category (${scarvesId}):`);
    console.log('='.repeat(50));
    
    const allScarves = await Product.countDocuments({ category: scarvesId });
    const activeScarves = await Product.countDocuments({ 
      category: scarvesId, 
      isActive: true 
    });
    
    console.log(`Total in Scarves:      ${allScarves}`);
    console.log(`Active in Scarves:     ${activeScarves}`);

    const scarvesList = await Product.find({ category: scarvesId }).lean();
    scarvesList.forEach(p => {
      console.log(`\n  - ${p.name}`);
      console.log(`    isActive: ${p.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkIsActive();
