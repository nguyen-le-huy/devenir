/**
 * Migration Script: Convert Category Images to WebP
 * 
 * This script will:
 * 1. Fetch all categories with thumbnailUrl from MongoDB
 * 2. Re-upload each image to Cloudinary with WebP conversion
 * 3. Update the category with the new WebP URL
 * 
 * Usage: node scripts/migrateCategoryImagesToWebP.js
 * 
 * Options:
 *   --dry-run    Preview changes without updating database
 *   --verbose    Show detailed logs
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Category Schema (inline to avoid import issues)
const categorySchema = new mongoose.Schema({
    name: String,
    thumbnailUrl: String,
    slug: String,
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

// Helper function to extract public_id from Cloudinary URL
function extractPublicId(url) {
    if (!url) return null;

    // Match pattern: /upload/v{version}/{public_id}.{format}
    // or /upload/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);

    if (match) {
        return match[1];
    }

    return null;
}

// Check if URL is already WebP
function isWebP(url) {
    if (!url) return false;
    return url.toLowerCase().endsWith('.webp');
}

// Convert image to WebP using Cloudinary
async function convertToWebP(originalUrl, categoryName) {
    try {
        const publicId = extractPublicId(originalUrl);

        if (!publicId) {
            console.log(`  ⚠️  Could not extract public_id from URL: ${originalUrl}`);
            return null;
        }

        if (VERBOSE) {
            console.log(`  📦 Public ID: ${publicId}`);
        }

        // Use Cloudinary's explicit API to create a WebP version
        const result = await cloudinary.uploader.explicit(publicId, {
            type: 'upload',
            eager: [
                {
                    format: 'webp',
                    quality: 'auto:best',
                }
            ],
            eager_async: false,
        });

        if (result.eager && result.eager[0]) {
            const webpUrl = result.eager[0].secure_url;
            if (VERBOSE) {
                console.log(`  ✅ WebP URL: ${webpUrl}`);
            }
            return webpUrl;
        }

        // Fallback: Direct URL transformation
        const transformedUrl = cloudinary.url(publicId, {
            format: 'webp',
            quality: 'auto:best',
            secure: true,
        });

        if (VERBOSE) {
            console.log(`  ✅ Transformed URL: ${transformedUrl}`);
        }

        return transformedUrl;

    } catch (error) {
        console.error(`  ❌ Error converting image for "${categoryName}":`, error.message);
        return null;
    }
}

// Main migration function
async function migrateCategoriesToWebP() {
    console.log('🚀 Starting Category Images WebP Migration');
    console.log('='.repeat(50));

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be made to database\n');
    }

    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Fetch all categories with thumbnailUrl
        const categories = await Category.find({
            thumbnailUrl: { $exists: true, $ne: null, $ne: '' }
        }).select('name slug thumbnailUrl');

        console.log(`📋 Found ${categories.length} categories with thumbnail images\n`);

        if (categories.length === 0) {
            console.log('ℹ️  No categories with images to migrate');
            return;
        }

        let converted = 0;
        let skipped = 0;
        let failed = 0;
        const results = [];

        for (const category of categories) {
            console.log(`\n🔄 Processing: ${category.name} (${category.slug})`);

            // Skip if already WebP
            if (isWebP(category.thumbnailUrl)) {
                console.log('  ⏭️  Already WebP, skipping...');
                skipped++;
                continue;
            }

            if (VERBOSE) {
                console.log(`  📷 Original URL: ${category.thumbnailUrl}`);
            }

            // Convert to WebP
            const webpUrl = await convertToWebP(category.thumbnailUrl, category.name);

            if (webpUrl) {
                results.push({
                    id: category._id,
                    name: category.name,
                    oldUrl: category.thumbnailUrl,
                    newUrl: webpUrl,
                });

                if (!DRY_RUN) {
                    // Update database
                    await Category.updateOne(
                        { _id: category._id },
                        { $set: { thumbnailUrl: webpUrl } }
                    );
                    console.log(`  💾 Updated in database`);
                } else {
                    console.log(`  📝 Would update: ${category.thumbnailUrl.slice(-30)} → ${webpUrl.slice(-30)}`);
                }

                converted++;
            } else {
                failed++;
            }

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Converted: ${converted}`);
        console.log(`⏭️  Skipped (already WebP): ${skipped}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📋 Total processed: ${categories.length}`);

        if (DRY_RUN && results.length > 0) {
            console.log('\n📋 Preview of changes:');
            results.forEach((r, i) => {
                console.log(`\n${i + 1}. ${r.name}`);
                console.log(`   Old: ${r.oldUrl}`);
                console.log(`   New: ${r.newUrl}`);
            });
            console.log('\n💡 Run without --dry-run to apply changes');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (VERBOSE) {
            console.error(error);
        }
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
migrateCategoriesToWebP();
