import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const convertAllCategoriesToObjectId = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Find all products with STRING category
    const productsWithStringCategory = await productsCollection.find({
      category: { $type: 'string' }
    }).toArray();
    
    console.log(`📦 Found ${productsWithStringCategory.length} products with STRING category\n`);
    
    if (productsWithStringCategory.length === 0) {
      console.log('✅ All products already have ObjectId category');
      process.exit(0);
    }
    
    console.log('🔄 Converting to ObjectId...\n');
    
    let updated = 0;
    let failed = 0;
    
    for (const product of productsWithStringCategory) {
      try {
        const categoryObjectId = new mongoose.Types.ObjectId(product.category);
        
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { category: categoryObjectId } }
        );
        
        console.log(`✅ ${product.name}`);
        console.log(`   "${product.category}" → ObjectId("${categoryObjectId}")`);
        updated++;
      } catch (error) {
        console.log(`❌ ${product.name}: ${error.message}`);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Successfully updated: ${updated} products`);
    console.log(`❌ Failed: ${failed} products`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

convertAllCategoriesToObjectId();
