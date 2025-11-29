/**
 * Test Script: Create Category with Level and Slug
 * This script tests if slug and level are properly saved to MongoDB
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/CategoryModel.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const testCreateCategory = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test 1: Create a parent category (level 0)
        console.log('📝 Test 1: Creating parent category...');
        const parentCategory = await Category.create({
            name: 'Test Parent Category',
            description: 'This is a test parent category',
            slug: 'test-parent-category',
            level: 0,
            isActive: true,
            sortOrder: 0,
            parentCategory: null,
        });

        console.log('✅ Parent category created:');
        console.log(`   - ID: ${parentCategory._id}`);
        console.log(`   - Name: ${parentCategory.name}`);
        console.log(`   - Slug: "${parentCategory.slug}"`);
        console.log(`   - Level: ${parentCategory.level}`);
        console.log(`   - Parent: ${parentCategory.parentCategory}\n`);

        // Test 2: Create a child category (level 1)
        console.log('📝 Test 2: Creating child category...');
        const childCategory = await Category.create({
            name: 'Test Child Category',
            description: 'This is a test child category',
            slug: 'test-child-category',
            level: 1,
            isActive: true,
            sortOrder: 0,
            parentCategory: parentCategory._id,
        });

        console.log('✅ Child category created:');
        console.log(`   - ID: ${childCategory._id}`);
        console.log(`   - Name: ${childCategory.name}`);
        console.log(`   - Slug: "${childCategory.slug}"`);
        console.log(`   - Level: ${childCategory.level}`);
        console.log(`   - Parent: ${childCategory.parentCategory}\n`);

        // Test 3: Verify data in MongoDB
        console.log('🔍 Test 3: Verifying data in MongoDB...');
        const verifyParent = await Category.findById(parentCategory._id);
        const verifyChild = await Category.findById(childCategory._id);

        console.log('✅ Parent category from DB:');
        console.log(`   - Slug: "${verifyParent.slug}" (Expected: "test-parent-category")`);
        console.log(`   - Level: ${verifyParent.level} (Expected: 0)`);
        
        console.log('✅ Child category from DB:');
        console.log(`   - Slug: "${verifyChild.slug}" (Expected: "test-child-category")`);
        console.log(`   - Level: ${verifyChild.level} (Expected: 1)\n`);

        // Cleanup
        console.log('🧹 Cleaning up test data...');
        await Category.deleteOne({ _id: childCategory._id });
        await Category.deleteOne({ _id: parentCategory._id });
        console.log('✅ Test data cleaned up\n');

        console.log('🎉 All tests passed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testCreateCategory();
