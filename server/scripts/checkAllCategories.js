import mongoose from 'mongoose';
import Product from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAllCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all categories
    const categories = await Category.find({}).lean();
    
    console.log('📋 All Categories in Database:');
    console.log('='.repeat(70));
    
    for (const cat of categories) {
      console.log(`\n🏷️  ${cat.name}`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   Parent: ${cat.parentCategory || 'None (Main Category)'}`);
      console.log(`   Active: ${cat.isActive}`);
      
      // Count products in this category (both ways)
      const countByString = await Product.countDocuments({ 
        category: cat._id.toString(),
        isActive: true 
      });
      
      const countByObjectId = await Product.countDocuments({ 
        category: cat._id,
        isActive: true 
      });
      
      console.log(`   Products (string query): ${countByString}`);
      console.log(`   Products (ObjectId query): ${countByObjectId}`);
      
      // Show sample products
      if (countByString > 0 || countByObjectId > 0) {
        const products = await Product.find({ 
          category: cat._id.toString(),
          isActive: true 
        }).limit(3).select('name category').lean();
        
        products.forEach(p => {
          console.log(`      • ${p.name} (category value: ${p.category}, type: ${typeof p.category})`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Check for orphan products (category không tồn tại)
    const allProducts = await Product.find({ isActive: true }).lean();
    const categoryIds = new Set(categories.map(c => c._id.toString()));
    
    console.log('\n🔍 Orphan Products Check:');
    const orphans = allProducts.filter(p => !categoryIds.has(p.category.toString()));
    
    if (orphans.length > 0) {
      console.log(`   Found ${orphans.length} products with invalid category:`);
      orphans.forEach(p => {
        console.log(`      • ${p.name} → category: ${p.category}`);
      });
    } else {
      console.log('   ✅ All products have valid categories');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

checkAllCategories();
