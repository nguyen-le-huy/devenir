/**
 * Migration Script: Fix Categories without slug or level
 * This script will:
 * 1. Find all categories without slug
 * 2. Generate slug from category name
 * 3. Calculate and update level based on parentCategory hierarchy
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/CategoryModel.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const fixCategorySlugLevel = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all categories
        const categories = await Category.find({});
        console.log(`📊 Found ${categories.length} categories\n`);

        let fixedCount = 0;

        for (const category of categories) {
            let needsUpdate = false;
            const updates = {};

            // Fix missing or empty slug
            if (!category.slug || category.slug.trim() === '') {
                const generatedSlug = category.name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                
                updates.slug = generatedSlug;
                needsUpdate = true;
                console.log(`🔧 Category "${category.name}": Generated slug = "${generatedSlug}"`);
            }

            // Calculate and fix level based on parent hierarchy
            let correctLevel = 0;
            if (category.parentCategory) {
                const parent = await Category.findById(category.parentCategory);
                if (parent) {
                    correctLevel = (parent.level || 0) + 1;
                }
            }

            if (category.level !== correctLevel) {
                updates.level = correctLevel;
                needsUpdate = true;
                console.log(`🔧 Category "${category.name}": Fixed level ${category.level} -> ${correctLevel}`);
            }

            // Update if needed
            if (needsUpdate) {
                await Category.findByIdAndUpdate(category._id, updates);
                fixedCount++;
            }
        }

        console.log(`\n✅ Migration complete! Fixed ${fixedCount} categories`);

        // Display all categories after fix
        console.log('\n📋 All categories after migration:');
        const updatedCategories = await Category.find({}).sort({ level: 1, name: 1 });
        updatedCategories.forEach(cat => {
            const parentName = cat.parentCategory 
                ? categories.find(c => c._id.equals(cat.parentCategory))?.name || '(not found)'
                : '(none)';
            console.log(`  - ${cat.name} | Level: ${cat.level} | Slug: "${cat.slug}" | Parent: ${parentName}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixCategorySlugLevel();
