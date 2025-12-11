/**
 * Ingestion Script for Self-hosted Visual Search (Qdrant)
 * 
 * Đọc tất cả product variants từ MongoDB và:
 * 1. Encode images qua CLIP service (batch)
 * 2. Upsert vào Qdrant với rich payload (không cần MongoDB lookup khi search)
 * 
 * Usage: node scripts/ingestion/ingest-to-qdrant.js
 */

// IMPORTANT: Load env FIRST before any imports that use env variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root - MUST be before other imports
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Verify env is loaded
console.log('📋 Environment check:');
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Missing'}`);
console.log(`   CLIP_SERVICE_URL: ${process.env.CLIP_SERVICE_URL || 'http://localhost:8899 (default)'}`);
console.log(`   QDRANT_URL: ${process.env.QDRANT_URL || 'http://localhost:6333 (default)'}\n`);

// Now import modules
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Import services
import { initQdrant, upsertVectors, deleteAllVectors, getCollectionStats, mongoIdToUuid } from '../../services/imageSearch/qdrantVectorStore.js';
import { encodeImageBatch, checkClipHealth } from '../../services/imageSearch/clipServiceClient.js';
import ProductVariant from '../../models/ProductVariantModel.js';
import Product from '../../models/ProductModel.js';  // Required for populate to work

// Configuration
const BATCH_SIZE = 5; // Encode 5 images at a time
const FORCE_REINDEX = process.argv.includes('--force');

/**
 * Main ingestion function
 */
async function ingestToQdrant() {
    console.log('🚀 Starting Visual Search Ingestion (Self-hosted Qdrant)');
    console.log('='.repeat(60));

    // Connect to MongoDB
    console.log('\n📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Check CLIP service health
    console.log('\n🔍 Checking CLIP service...');
    const clipHealth = await checkClipHealth();
    if (!clipHealth) {
        console.error('❌ CLIP service is not available!');
        console.log('Please start the CLIP service first:');
        console.log('  docker compose -f docker-compose.visual-search.yml up clip-service');
        process.exit(1);
    }
    console.log(`✅ CLIP service healthy (${clipHealth.model}, ${clipHealth.dims} dims)`);

    // Init Qdrant
    console.log('\n📦 Initializing Qdrant...');
    await initQdrant();

    // Force reindex if flag is set
    if (FORCE_REINDEX) {
        console.log('\n⚠️ Force reindex: Deleting all existing vectors...');
        await deleteAllVectors();
    }

    // Get current stats
    const beforeStats = await getCollectionStats();
    console.log(`📊 Current vectors in Qdrant: ${beforeStats.vectorCount || 0}`);

    // Fetch all variants with product info
    console.log('\n📦 Fetching product variants from MongoDB...');
    const variants = await ProductVariant.find({})
        .populate('product_id', 'name category description urlSlug')
        .lean();

    console.log(`✅ Found ${variants.length} variants`);

    // Filter variants with images
    const variantsWithImages = variants.filter(v => v.mainImage);
    console.log(`📸 Variants with images: ${variantsWithImages.length}`);

    if (variantsWithImages.length === 0) {
        console.log('❌ No variants with images found!');
        process.exit(1);
    }

    // Process in batches
    let processed = 0;
    let failed = 0;
    const totalBatches = Math.ceil(variantsWithImages.length / BATCH_SIZE);

    console.log(`\n🔄 Processing ${totalBatches} batches (${BATCH_SIZE} items each)...`);
    console.log('-'.repeat(60));

    for (let i = 0; i < variantsWithImages.length; i += BATCH_SIZE) {
        const batch = variantsWithImages.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);

        // Prepare image URLs for CLIP
        const imageUrls = batch.map(v => v.mainImage);

        try {
            // Encode batch via CLIP service
            console.log('  🔍 Encoding images via CLIP...');
            const { embeddings, processingTime } = await encodeImageBatch(imageUrls);
            console.log(`  ✅ Encoded ${embeddings.length} images in ${processingTime}ms`);

            // Prepare vectors with rich payload
            const vectors = batch.map((variant, idx) => ({
                // Use UUID format for Qdrant (convert MongoDB ObjectId to UUID)
                id: mongoIdToUuid(variant._id.toString()),
                vector: embeddings[idx],
                payload: {
                    // Core identification
                    variantId: variant._id.toString(),
                    productId: variant.product_id?._id?.toString(),

                    // Display data (no MongoDB lookup needed)
                    productName: variant.product_id?.name || 'Unknown Product',
                    color: variant.color,
                    size: variant.size,
                    price: variant.price,
                    sku: variant.sku || '',

                    // Images
                    mainImage: variant.mainImage,
                    hoverImage: variant.hoverImage || variant.mainImage,

                    // Navigation
                    urlSlug: variant.product_id?.urlSlug || '',

                    // Stock status
                    inStock: variant.quantity > 0,
                    quantity: variant.quantity,

                    // Metadata
                    indexedAt: new Date().toISOString()
                }
            }));

            // Upsert to Qdrant
            console.log('  📤 Upserting to Qdrant...');
            const { upserted } = await upsertVectors(vectors);
            console.log(`  ✅ Upserted ${upserted} vectors`);

            processed += upserted;
        } catch (error) {
            console.error(`  ❌ Batch ${batchNum} failed:`, error.message);
            failed += batch.length;
        }

        // Progress indicator
        const progress = ((i + BATCH_SIZE) / variantsWithImages.length * 100).toFixed(1);
        console.log(`  📊 Progress: ${progress}%`);
    }

    // Final stats
    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION COMPLETE');
    console.log('='.repeat(60));

    const afterStats = await getCollectionStats();
    console.log(`\n✅ Successfully indexed: ${processed} variants`);
    console.log(`❌ Failed: ${failed} variants`);
    console.log(`📦 Total vectors in Qdrant: ${afterStats.vectorCount}`);

    // Cleanup
    await mongoose.disconnect();
    console.log('\n👋 Done!');
    process.exit(0);
}

// Run
ingestToQdrant().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
