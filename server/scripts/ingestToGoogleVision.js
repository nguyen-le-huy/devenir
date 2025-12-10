/**
 * Script để upload ảnh lên Google Cloud Storage & Index vào Vision API Product Search
 * 
 * Chạy: node scripts/ingestToGoogleVision.js
 * 
 * Options:
 *   --clear    Xóa tất cả products trong Product Set trước khi ingest
 *   --new      Chỉ ingest các products chưa có trong Vision API
 *   --dry-run  Chỉ kiểm tra, không upload thực sự
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';
import vision from '@google-cloud/vision';
import mongoose from 'mongoose';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Parse arguments
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const onlyNew = args.includes('--new');
const dryRun = args.includes('--dry-run');

// Environment variables
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const LOCATION = process.env.GOOGLE_LOCATION || 'us-west1';
const PRODUCT_SET_ID = process.env.GOOGLE_PRODUCT_SET_ID || 'fashion-set-01';
const BUCKET_NAME = process.env.GOOGLE_STORAGE_BUCKET;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Print environment check
console.log('\n📋 Environment check:');
console.log(`   GOOGLE_PROJECT_ID: ${PROJECT_ID ? '✅ ' + PROJECT_ID : '❌ Missing'}`);
console.log(`   GOOGLE_LOCATION: ${LOCATION}`);
console.log(`   GOOGLE_PRODUCT_SET_ID: ${PRODUCT_SET_ID}`);
console.log(`   GOOGLE_STORAGE_BUCKET: ${BUCKET_NAME ? '✅ ' + BUCKET_NAME : '❌ Missing'}`);
console.log(`   GOOGLE_APPLICATION_CREDENTIALS: ${CREDENTIALS_PATH ? '✅ Set' : '❌ Missing'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Missing'}\n`);

if (!PROJECT_ID || !BUCKET_NAME || !CREDENTIALS_PATH || !process.env.MONGO_URI) {
    console.error('❌ Missing required environment variables!');
    console.error('Please ensure all GOOGLE_* and MONGO_URI are set in .env');
    process.exit(1);
}

// Initialize Google Cloud clients
const storage = new Storage({
    projectId: PROJECT_ID,
    keyFilename: path.resolve(__dirname, '..', CREDENTIALS_PATH)
});

const productSearchClient = new vision.ProductSearchClient({
    projectId: PROJECT_ID,
    keyFilename: path.resolve(__dirname, '..', CREDENTIALS_PATH)
});

// Resource paths
const locationPath = productSearchClient.locationPath(PROJECT_ID, LOCATION);
const productSetPath = productSearchClient.productSetPath(PROJECT_ID, LOCATION, PRODUCT_SET_ID);

/**
 * Download image from URL and return as buffer
 */
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        client.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Upload image buffer to Google Cloud Storage
 */
async function uploadToGCS(buffer, filename) {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`vision-products/${filename}`);

    await file.save(buffer, {
        metadata: {
            contentType: 'image/jpeg'
        }
    });

    return `gs://${BUCKET_NAME}/vision-products/${filename}`;
}

/**
 * Check if product already exists in Vision API
 */
async function productExists(productId) {
    try {
        const productPath = productSearchClient.productPath(PROJECT_ID, LOCATION, productId);
        await productSearchClient.getProduct({ name: productPath });
        return true;
    } catch (error) {
        if (error.code === 5) { // NOT_FOUND
            return false;
        }
        throw error;
    }
}

/**
 * Create a product in Vision API
 */
async function createProduct(variantData) {
    const productId = variantData._id.toString();
    const productName = variantData.product_id?.name || 'Unknown Product';

    const product = {
        displayName: `${productName} - ${variantData.color}`,
        productCategory: 'apparel-v2', // Use fashion/apparel category for better matching
        productLabels: [
            { key: 'color', value: variantData.color || 'unknown' },
            { key: 'size', value: variantData.size || 'unknown' },
            { key: 'price', value: String(variantData.price || 0) },
            { key: 'sku', value: variantData.sku || '' },
            { key: 'urlSlug', value: variantData.product_id?.urlSlug || '' },
            { key: 'productId', value: variantData.product_id?._id?.toString() || '' },
            { key: 'variantId', value: productId }
        ]
    };

    const [createdProduct] = await productSearchClient.createProduct({
        parent: locationPath,
        product: product,
        productId: productId
    });

    return createdProduct;
}

/**
 * Add product to product set
 */
async function addProductToSet(productId) {
    const productPath = productSearchClient.productPath(PROJECT_ID, LOCATION, productId);

    await productSearchClient.addProductToProductSet({
        name: productSetPath,
        product: productPath
    });
}

/**
 * Create reference image for product
 */
async function createReferenceImage(productId, gcsUri) {
    const productPath = productSearchClient.productPath(PROJECT_ID, LOCATION, productId);
    const referenceImageId = `${productId}-main`;

    const referenceImage = {
        uri: gcsUri
    };

    const [createdImage] = await productSearchClient.createReferenceImage({
        parent: productPath,
        referenceImage: referenceImage,
        referenceImageId: referenceImageId
    });

    return createdImage;
}

/**
 * Delete all products in product set (for --clear option)
 */
async function clearProductSet() {
    console.log('🗑️ Clearing all products in product set...');

    try {
        // List all products in the product set
        const [products] = await productSearchClient.listProductsInProductSet({
            name: productSetPath
        });

        console.log(`   Found ${products.length} products to delete`);

        for (const product of products) {
            try {
                // Remove from product set
                await productSearchClient.removeProductFromProductSet({
                    name: productSetPath,
                    product: product.name
                });

                // Delete the product
                await productSearchClient.deleteProduct({
                    name: product.name
                });

                console.log(`   ✅ Deleted: ${product.displayName}`);
            } catch (error) {
                console.log(`   ⚠️ Failed to delete ${product.displayName}: ${error.message}`);
            }
        }

        console.log('✅ Product set cleared');
    } catch (error) {
        console.log(`⚠️ Error clearing product set: ${error.message}`);
    }
}

/**
 * Ensure product set exists
 */
async function ensureProductSetExists() {
    try {
        await productSearchClient.getProductSet({ name: productSetPath });
        console.log(`✅ Product set "${PRODUCT_SET_ID}" exists`);
    } catch (error) {
        if (error.code === 5) { // NOT_FOUND
            console.log(`📦 Creating product set "${PRODUCT_SET_ID}"...`);
            await productSearchClient.createProductSet({
                parent: locationPath,
                productSet: {
                    displayName: 'Devenir Fashion Products'
                },
                productSetId: PRODUCT_SET_ID
            });
            console.log('✅ Product set created');
        } else {
            throw error;
        }
    }
}

async function main() {
    const startTime = Date.now();

    try {
        // Import models after dotenv is loaded
        const ProductVariant = (await import('../models/ProductVariantModel.js')).default;

        // Connect MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Ensure product set exists
        await ensureProductSetExists();

        // Clear if requested
        if (shouldClear && !dryRun) {
            await clearProductSet();
        }

        // Fetch all active variants with images
        console.log('\n🖼️ Fetching product variants with images...');
        const variants = await ProductVariant.find({
            isActive: true,
            mainImage: { $exists: true, $ne: '' }
        })
            .populate('product_id', 'name category description urlSlug')
            .lean();

        console.log(`📊 Found ${variants.length} variants with images`);

        if (variants.length === 0) {
            console.log('⚠️ No variants to process. Exiting.');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Filter only new if requested
        let toProcess = variants;
        if (onlyNew && !shouldClear) {
            console.log('\n🔍 Checking for new variants only...');
            const newVariants = [];
            for (const variant of variants) {
                const exists = await productExists(variant._id.toString());
                if (!exists) {
                    newVariants.push(variant);
                }
            }
            toProcess = newVariants;
            console.log(`📊 Found ${toProcess.length} new variants to process`);
        }

        if (toProcess.length === 0) {
            console.log('✅ All variants already indexed. Nothing to do.');
            await mongoose.disconnect();
            process.exit(0);
        }

        if (dryRun) {
            console.log('\n🏃 DRY RUN - No actual uploads will be performed');
            console.log(`   Would process ${toProcess.length} variants`);
            await mongoose.disconnect();
            process.exit(0);
        }

        // Process variants
        const errors = [];
        let processed = 0;
        let successful = 0;

        console.log('\n🚀 Starting Google Vision ingestion...\n');

        for (const variant of toProcess) {
            processed++;
            const productName = variant.product_id?.name || 'Unknown';
            const variantId = variant._id.toString();

            console.log(`[${processed}/${toProcess.length}] ${productName} (${variant.color})`);

            try {
                // Step 1: Download image from Cloudinary
                console.log('   📥 Downloading image...');
                const imageBuffer = await downloadImage(variant.mainImage);

                // Step 2: Upload to Google Cloud Storage
                console.log('   ☁️ Uploading to GCS...');
                const filename = `${variantId}.jpg`;
                const gcsUri = await uploadToGCS(imageBuffer, filename);

                // Step 3: Create product in Vision API
                console.log('   🏷️ Creating product in Vision API...');
                await createProduct(variant);

                // Step 4: Add product to product set
                console.log('   📦 Adding to product set...');
                await addProductToSet(variantId);

                // Step 5: Create reference image
                console.log('   🖼️ Creating reference image...');
                await createReferenceImage(variantId, gcsUri);

                console.log('   ✅ Done');
                successful++;

                // Rate limiting - Google Vision has limits
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                errors.push({
                    variant: variantId,
                    name: productName,
                    error: error.message
                });
            }
        }

        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n' + '='.repeat(50));
        console.log('📊 INGESTION SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total variants: ${toProcess.length}`);
        console.log(`Successful: ${successful}`);
        console.log(`Errors: ${errors.length}`);
        console.log(`Duration: ${duration}s`);

        if (errors.length > 0) {
            console.log('\n❌ Errors:');
            errors.slice(0, 10).forEach(e => console.log(`   - ${e.name}: ${e.error}`));
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more`);
            }
        }

        console.log('\n⚠️ Note: Vision API index may take a few minutes to update.');
        console.log('   You can check indexing status in Google Cloud Console.');
        console.log('\n✅ Google Vision ingestion complete!');

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

main();
