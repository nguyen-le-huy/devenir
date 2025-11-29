/**
 * Delete Test Categories Script
 * Removes all categories that start with "test" (case-insensitive)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/CategoryModel.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const deleteTestCategories = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all test categories
        const testCategories = await Category.find({
            name: { $regex: /^test/i }
        });

        console.log(`📊 Found ${testCategories.length} test categories:`);
        testCategories.forEach(cat => {
            console.log(`   - ${cat.name} (ID: ${cat._id})`);
        });

        if (testCategories.length === 0) {
            console.log('\n✅ No test categories to delete');
            process.exit(0);
        }

        // Delete all test categories
        const result = await Category.deleteMany({
            name: { $regex: /^test/i }
        });

        console.log(`\n✅ Deleted ${result.deletedCount} test categories`);

        // Show remaining categories
        const remaining = await Category.find({}).sort({ name: 1 });
        console.log(`\n📋 Remaining categories (${remaining.length}):`);
        remaining.forEach(cat => {
            console.log(`   - ${cat.name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

deleteTestCategories();
