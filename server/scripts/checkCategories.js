import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Category from '../models/CategoryModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const checkCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const categories = await Category.find({}).sort({ createdAt: -1 }).limit(5);
        
        console.log('\n📦 Last 5 Categories:');
        console.log('==========================================');
        
        categories.forEach((cat, index) => {
            console.log(`\n${index + 1}. ${cat.name}`);
            console.log(`   ID: ${cat._id}`);
            console.log(`   Level: ${cat.level}`);
            console.log(`   Slug: ${cat.slug || 'NULL'}`);
            console.log(`   Parent: ${cat.parentCategory || 'NULL (Root)'}`);
            console.log(`   Active: ${cat.isActive}`);
            console.log(`   Created: ${cat.createdAt}`);
        });

        console.log('\n==========================================');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkCategories();
