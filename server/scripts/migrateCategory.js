import mongoose from 'mongoose';
import Product from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateCategories = async () => {
  try {
    console.log('🔄 Starting category migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devenir');
    console.log('✅ Connected to MongoDB');

    // Get all products
    const products = await Product.find({}).lean();
    console.log(`📦 Found ${products.length} products to migrate`);

    let updated = 0;
    let failed = 0;

    for (const product of products) {
      try {
        // If category is already an ObjectId, skip
        if (mongoose.Types.ObjectId.isValid(product.category)) {
          const objectId = new mongoose.Types.ObjectId(product.category);
          const exists = await Category.findById(objectId);
          if (exists) {
            console.log(`✓ Product "${product.name}" already has valid category reference`);
            continue;
          }
        }

        // Try to find category by name (fallback approach)
        const categoryName = typeof product.category === 'string' ? product.category : null;
        if (!categoryName) {
          console.log(`⚠️  Product "${product.name}" has no category, setting to null`);
          await Product.findByIdAndUpdate(product._id, { category: null });
          updated++;
          continue;
        }

        // Find category by name
        const category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
        
        if (category) {
          await Product.findByIdAndUpdate(product._id, { category: category._id });
          console.log(`✅ Updated product "${product.name}" with category "${category.name}"`);
          updated++;
        } else {
          console.log(`❌ Category "${categoryName}" not found for product "${product.name}"`);
          failed++;
        }
      } catch (err) {
        console.error(`❌ Error updating product "${product.name}":`, err.message);
        failed++;
      }
    }

    console.log(`\n📊 Migration complete!`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateCategories();
