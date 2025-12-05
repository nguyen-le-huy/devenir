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
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   PINECONE_INDEX_NAME: ${process.env.PINECONE_INDEX_NAME || 'clothing-store (default)'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Missing'}\n`);

// Exit if missing required keys
if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
    console.error('❌ Missing required API keys. Please check your .env file:');
    console.error('   - OPENAI_API_KEY');
    console.error('   - PINECONE_API_KEY');
    console.error('   - PINECONE_INDEX_NAME (optional, defaults to "clothing-store")');
    process.exit(1);
}

// Now import modules that depend on env variables
import mongoose from 'mongoose';
import Product from '../../models/ProductModel.js';
import ProductVariant from '../../models/ProductVariantModel.js';
import Category from '../../models/CategoryModel.js';
import Brand from '../../models/BrandModel.js';
import { initializePinecone, getPineconeIndex } from '../../config/pinecone.js';
import { createProductPropositions, createSimpleChunks } from '../../services/rag/embeddings/proposition.service.js';
import { getEmbedding } from '../../services/rag/embeddings/embedding.service.js';

// IMPORTANT: Must match your Pinecone index dimension
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Ingest all products to Pinecone
 */
async function ingestAllProducts() {
    try {
        console.log('🚀 Starting product ingestion to Pinecone...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Initialize Pinecone
        await initializePinecone();
        console.log('✅ Pinecone initialized');

        const index = getPineconeIndex();

        // Get all active products - only populate category (brand might be string)
        const products = await Product.find({
            isActive: true,
            status: 'published'
        })
            .populate('category')
            .lean();

        console.log(`📦 Found ${products.length} products to ingest\n`);

        if (products.length === 0) {
            console.log('⚠️ No products found to ingest');
            return;
        }

        let totalVectors = 0;
        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                console.log(`Processing: ${product.name}`);

                // Get variants
                const variants = await ProductVariant.find({
                    product_id: product._id,
                    isActive: true
                }).lean();

                // Try LLM propositions first, fallback to simple chunks
                let propositions;
                try {
                    propositions = await createProductPropositions(product, variants);
                } catch (propError) {
                    console.log(`  ⚠️ LLM proposition failed, using simple chunks`);
                    propositions = createSimpleChunks(product, variants);
                }

                console.log(`  └─ Generated ${propositions.length} propositions`);

                // Prepare vectors
                const vectors = [];

                for (let i = 0; i < propositions.length; i++) {
                    const propText = propositions[i];
                    const embedding = await getEmbedding(propText, EMBEDDING_DIMENSIONS);

                    vectors.push({
                        id: `prod_${product._id}_prop_${i}`,
                        values: embedding,
                        metadata: {
                            type: 'product_info',
                            product_id: product._id.toString(),
                            product_name: product.name,
                            category: product.category?.name || 'N/A',
                            brand: product.brand?.name || 'N/A',
                            tags: product.tags || [],
                            average_rating: product.averageRating || 0,
                            proposition_text: propText,
                            url_slug: product.urlSlug || '',
                            in_stock: variants.some(v => v.quantity > 0)
                        }
                    });
                }

                // Add variant info vector
                if (variants.length > 0) {
                    const sizes = [...new Set(variants.map(v => v.size))];
                    const colors = [...new Set(variants.map(v => v.color))];
                    const prices = variants.map(v => v.price);

                    const sizeColorInfo = `${product.name} có sizes ${sizes.join(', ')} và màu ${colors.join(', ')}. Giá từ ${Math.min(...prices).toLocaleString()} đến ${Math.max(...prices).toLocaleString()} VNĐ`;
                    const sizeColorEmbedding = await getEmbedding(sizeColorInfo, EMBEDDING_DIMENSIONS);

                    vectors.push({
                        id: `prod_${product._id}_variants_info`,
                        values: sizeColorEmbedding,
                        metadata: {
                            type: 'variant_info',
                            product_id: product._id.toString(),
                            product_name: product.name,
                            category: product.category?.name || 'N/A',
                            available_sizes: sizes,
                            available_colors: colors,
                            in_stock: variants.some(v => v.quantity > 0),
                            min_price: Math.min(...prices),
                            max_price: Math.max(...prices),
                            proposition_text: sizeColorInfo
                        }
                    });
                }

                // Upsert to Pinecone
                await index.upsert(vectors);
                console.log(`  ✅ Upserted ${vectors.length} vectors\n`);

                totalVectors += vectors.length;
                successCount++;

                // Delay to avoid rate limit
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (productError) {
                console.error(`  ❌ Error processing ${product.name}:`, productError.message);
                errorCount++;
            }
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`🎉 Ingestion completed!`);
        console.log(`📊 Total vectors: ${totalVectors}`);
        console.log(`✅ Successful: ${successCount} products`);
        console.log(`❌ Errors: ${errorCount} products`);
        console.log(`${'='.repeat(50)}`);

    } catch (error) {
        console.error('❌ Ingestion Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run
ingestAllProducts();
