/**
 * Script: Migrate Product Images to WebP
 * 
 * This script converts all existing product images on Cloudinary to WebP format.
 * It updates the database with new WebP URLs.
 * 
 * Usage: node scripts/migrateImagesToWebP.js
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import models
import ProductVariant from '../models/ProductVariantModel.js';

/**
 * Convert a Cloudinary image to WebP format
 * @param {string} originalUrl - Original Cloudinary URL
 * @returns {Promise<string>} - New WebP URL
 */
async function convertToWebP(originalUrl) {
    if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
        return originalUrl;
    }

    // Already WebP
    if (originalUrl.endsWith('.webp')) {
        return originalUrl;
    }

    try {
        // Extract public_id from URL
        // Pattern: https://res.cloudinary.com/xxx/image/upload/v1234/folder/file.png
        const uploadIndex = originalUrl.indexOf('/upload/');
        if (uploadIndex === -1) return originalUrl;

        const afterUpload = originalUrl.substring(uploadIndex + 8);
        // Remove version if present (v1234/)
        const withoutVersion = afterUpload.replace(/^v\d+\//, '');
        // Remove file extension
        const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

        console.log(`  Converting: ${publicId}`);

        // Use Cloudinary's explicit method to convert and upload as WebP
        const result = await cloudinary.uploader.explicit(publicId, {
            type: 'upload',
            eager: [{
                format: 'webp',
                quality: 90,
            }],
            eager_async: false,
        });

        // Get the WebP URL from eager transformation
        if (result.eager && result.eager[0]) {
            const webpUrl = result.eager[0].secure_url;
            console.log(`  ✅ Converted to: ${webpUrl}`);
            return webpUrl;
        }

        // Fallback: just change extension in URL
        return originalUrl.replace(/\.[^/.]+$/, '.webp');
    } catch (error) {
        console.error(`  ❌ Error converting ${originalUrl}:`, error.message);
        return originalUrl; // Return original on error
    }
}

/**
 * Migrate all product variant images to WebP
 */
async function migrateImages() {
    console.log('🚀 Starting image migration to WebP...\n');

    try {
        // Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all variants with images
        const variants = await ProductVariant.find({
            $or: [
                { mainImage: { $exists: true, $ne: null } },
                { hoverImage: { $exists: true, $ne: null } },
                { gallery: { $exists: true, $ne: [] } }
            ]
        });

        console.log(`📸 Found ${variants.length} variants with images\n`);

        let converted = 0;
        let failed = 0;
        let skipped = 0;

        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];
            console.log(`\n[${i + 1}/${variants.length}] Processing variant: ${variant.name || variant._id}`);

            let updated = false;

            // Convert mainImage
            if (variant.mainImage && !variant.mainImage.endsWith('.webp')) {
                const newUrl = await convertToWebP(variant.mainImage);
                if (newUrl !== variant.mainImage) {
                    variant.mainImage = newUrl;
                    updated = true;
                    converted++;
                }
            } else if (variant.mainImage?.endsWith('.webp')) {
                skipped++;
            }

            // Convert hoverImage
            if (variant.hoverImage && !variant.hoverImage.endsWith('.webp')) {
                const newUrl = await convertToWebP(variant.hoverImage);
                if (newUrl !== variant.hoverImage) {
                    variant.hoverImage = newUrl;
                    updated = true;
                    converted++;
                }
            } else if (variant.hoverImage?.endsWith('.webp')) {
                skipped++;
            }

            // Convert gallery images
            if (variant.gallery && variant.gallery.length > 0) {
                const newGallery = [];
                for (const img of variant.gallery) {
                    if (img && !img.endsWith('.webp')) {
                        const newUrl = await convertToWebP(img);
                        newGallery.push(newUrl);
                        if (newUrl !== img) {
                            converted++;
                            updated = true;
                        }
                    } else if (img?.endsWith('.webp')) {
                        newGallery.push(img);
                        skipped++;
                    } else {
                        newGallery.push(img);
                    }
                }
                variant.gallery = newGallery;
            }

            // Save if updated
            if (updated) {
                await variant.save();
                console.log(`  💾 Saved variant`);
            }

            // Rate limiting - wait 500ms between variants to avoid Cloudinary rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Converted: ${converted} images`);
        console.log(`   ⏭️  Skipped (already WebP): ${skipped} images`);
        console.log(`   ❌ Failed: ${failed} images`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📦 Disconnected from MongoDB');
        console.log('✅ Migration complete!');
    }
}

// Run the migration
migrateImages();
