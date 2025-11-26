import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkCategoryTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Get all products and group by category type
    const allProducts = await productsCollection.find({ isActive: true }).toArray();
    
    console.log(`📊 Total Products: ${allProducts.length}\n`);
    
    const stringCategories = allProducts.filter(p => typeof p.category === 'string');
    const objectIdCategories = allProducts.filter(p => typeof p.category === 'object');
    
    console.log('🔤 Products with STRING category:');
    console.log('='.repeat(70));
    stringCategories.forEach(p => {
      console.log(`   • ${p.name}`);
      console.log(`     category: "${p.category}" (string)`);
    });
    
    console.log(`\n   Total: ${stringCategories.length} products\n`);
    
    console.log('🔷 Products with ObjectId category:');
    console.log('='.repeat(70));
    objectIdCategories.forEach(p => {
      console.log(`   • ${p.name}`);
      console.log(`     category: ObjectId("${p.category}") (object)`);
    });
    
    console.log(`\n   Total: ${objectIdCategories.length} products`);

    // Group string categories
    if (stringCategories.length > 0) {
      console.log('\n\n📋 String Categories Distribution:');
      console.log('='.repeat(70));
      const categoryGroups = {};
      stringCategories.forEach(p => {
        const catId = p.category;
        if (!categoryGroups[catId]) {
          categoryGroups[catId] = [];
        }
        categoryGroups[catId].push(p.name);
      });
      
      for (const [catId, products] of Object.entries(categoryGroups)) {
        console.log(`\n   ${catId}: ${products.length} products`);
        products.forEach(name => console.log(`      - ${name}`));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkCategoryTypes();
