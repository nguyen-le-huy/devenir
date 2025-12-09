/**
 * Script để tạo CLIP embeddings cho tất cả product images
 * Chạy: node scripts/ingestImageEmbeddings.js
 * 
 * Options:
 *   --clear    Xóa tất cả embeddings trước khi ingest
 *   --new      Chỉ ingest các products chưa có embedding
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify environment
console.log('\n📋 Environment check:');
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   PINECONE_IMAGE_INDEX_NAME: ${process.env.PINECONE_IMAGE_INDEX_NAME || 'visual-search'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Missing'}\n`);

if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY || !process.env.MONGO_URI) {
    console.error('❌ Missing required environment variables!');
    console.error('Please ensure OPENAI_API_KEY is set in .env');
    process.exit(1);
}

import mongoose from 'mongoose';
import ProductVariant from '../models/ProductVariantModel.js';
import Product from '../models/ProductModel.js';
import { getImageEmbedding } from '../services/imageSearch/clipEmbedding.js';
import {
    initImageVectorStore,
    upsertImageEmbeddings,
    deleteAllImageEmbeddings,
    getImageIndexStats,
    hasEmbedding
} from '../services/imageSearch/imageVectorStore.js';

// Parse arguments
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const onlyNew = args.includes('--new');

async function main() {
    const startTime = Date.now();

    try {
        // Connect MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Initialize Pinecone
        console.log('📌 Initializing Pinecone...');
        await initImageVectorStore();
        console.log('✅ Pinecone ready');

        // Clear if requested
        if (shouldClear) {
            console.log('\n🗑️ Clearing existing embeddings...');
            await deleteAllImageEmbeddings();
            console.log('✅ Cleared');
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
                const exists = await hasEmbedding(variant._id.toString());
                if (!exists) {
                    newVariants.push(variant);
                }
            }
            toProcess = newVariants;
            console.log(`📊 Found ${toProcess.length} new variants to process`);
        }

        if (toProcess.length === 0) {
            console.log('✅ All variants already have embeddings. Nothing to do.');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Process variants
        const vectors = [];
        const errors = [];
        let processed = 0;

        console.log('\n🚀 Starting embedding generation...\n');

        for (const variant of toProcess) {
            processed++;
            const productName = variant.product_id?.name || 'Unknown';

            console.log(`[${processed}/${toProcess.length}] ${productName} (${variant.color})`);

            try {
                // Get CLIP embedding
                const embedding = await getImageEmbedding(variant.mainImage);

                vectors.push({
                    id: variant._id.toString(),
                    values: embedding,
                    metadata: {
                        variantId: variant._id.toString(),
                        productId: variant.product_id?._id?.toString() || '',
                        productName: productName,
                        color: variant.color,
                        size: variant.size,
                        price: variant.price,
                        mainImage: variant.mainImage,
                        sku: variant.sku,
                        urlSlug: variant.product_id?.urlSlug || ''
                    }
                });

                console.log(`   ✅ OK`);

                // Batch upsert every 20 vectors
                if (vectors.length >= 20) {
                    console.log(`\n📤 Upserting batch of ${vectors.length} vectors...`);
                    await upsertImageEmbeddings(vectors);
                    console.log('   ✅ Batch upserted\n');
                    vectors.length = 0;
                }

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                errors.push({ variant: variant._id.toString(), name: productName, error: error.message });
            }
        }

        // Upsert remaining vectors
        if (vectors.length > 0) {
            console.log(`\n📤 Upserting final batch of ${vectors.length} vectors...`);
            await upsertImageEmbeddings(vectors);
            console.log('   ✅ Done');
        }

        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n' + '='.repeat(50));
        console.log('📊 INGESTION SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total variants: ${toProcess.length}`);
        console.log(`Successful: ${toProcess.length - errors.length}`);
        console.log(`Errors: ${errors.length}`);
        console.log(`Duration: ${duration}s`);

        if (errors.length > 0) {
            console.log('\n❌ Errors:');
            errors.slice(0, 10).forEach(e => console.log(`   - ${e.name}: ${e.error}`));
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more`);
            }
        }

        // Show index stats
        console.log('\n📌 Pinecone Index Stats:');
        const stats = await getImageIndexStats();
        console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
        console.log(`   Namespaces: ${JSON.stringify(stats.namespaces || {})}`);

        console.log('\n✅ Image embedding ingestion complete!');

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
