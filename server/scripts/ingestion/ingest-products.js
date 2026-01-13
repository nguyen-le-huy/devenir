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
import Category from '../../models/CategoryModel.js'; // Required for populate
import { initializePinecone, getPineconeIndex } from '../../config/pinecone.js';
import { getEmbedding } from '../../services/rag/embeddings/embedding.service.js';
import { openai, MODELS } from '../../config/openai.js';

// IMPORTANT: Must match your Pinecone index dimension
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Delete all vectors from Pinecone index
 */
async function deleteAllVectors() {
    console.log('🗑️  Deleting all existing vectors from Pinecone...');
    const index = getPineconeIndex();

    try {
        // Delete all vectors by using deleteAll
        await index.deleteAll();
        console.log('✅ All vectors deleted successfully\n');
    } catch (error) {
        // If deleteAll doesn't work, try namespace deletion
        console.log('⚠️  deleteAll not supported, trying alternative method...');
        try {
            // Describe index to get stats
            const stats = await index.describeIndexStats();
            console.log(`📊 Index stats: ${JSON.stringify(stats)}`);

            // Delete by filter if possible, or recreate
            await index.deleteMany({
                deleteAll: true
            });
            console.log('✅ All vectors deleted via deleteMany\n');
        } catch (err2) {
            console.error('❌ Could not delete vectors:', err2.message);
            console.log('📝 Continuing with upsert (will overwrite existing vectors)\n');
        }
    }
}

/**
 * Create optimized propositions for a product
 * Each color variant gets its own proposition for better search accuracy
 */
function createOptimizedPropositions(product, variants = []) {
    const propositions = [];
    const productName = product.name;
    const categoryName = product.category?.name || '';
    const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand || '';

    // Get unique values
    const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const prices = variants.map(v => v.price).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // 1. Main product proposition (most important)
    const mainProp = [
        productName,
        categoryName ? `là ${categoryName}` : '',
        brandName ? `của ${brandName}` : '',
        colors.length > 0 ? `có màu ${colors.join(', ')}` : '',
        sizes.length > 0 ? `có sizes ${sizes.join(', ')}` : '',
        minPrice > 0 ? `giá $${minPrice}${maxPrice !== minPrice ? ` - $${maxPrice}` : ''}` : ''
    ].filter(Boolean).join('. ');
    propositions.push(mainProp);

    // 2. One proposition per COLOR (critical for color search)
    for (const color of colors) {
        const colorVariants = variants.filter(v => v.color === color);
        const colorPrices = colorVariants.map(v => v.price).filter(p => p > 0);
        const colorSizes = [...new Set(colorVariants.map(v => v.size))];
        const colorMinPrice = colorPrices.length > 0 ? Math.min(...colorPrices) : minPrice;
        const colorStock = colorVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);

        const colorProp = `${productName} màu ${color}. ${categoryName}. Sizes: ${colorSizes.join(', ')}. Giá: $${colorMinPrice}. ${colorStock > 0 ? 'Còn hàng' : 'Hết hàng'}.`;
        propositions.push(colorProp);
    }

    // 3. Description proposition (if exists)
    if (product.description && product.description.length > 20) {
        // Clean and truncate description
        const cleanDesc = product.description
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 500);
        propositions.push(`${productName}. ${cleanDesc}`);
    }

    // 4. Search-friendly proposition with keywords
    const keywords = [];
    if (product.tags && product.tags.length > 0) {
        keywords.push(...product.tags);
    }
    // Extract material keywords from description
    const materialKeywords = ['cashmere', 'wool', 'cotton', 'silk', 'linen', 'leather', 'denim', 'velvet', 'alpaca', 'polyester'];
    const descLower = (product.description || '').toLowerCase();
    for (const material of materialKeywords) {
        if (descLower.includes(material)) {
            keywords.push(material);
        }
    }
    if (keywords.length > 0) {
        propositions.push(`${productName}. Từ khóa: ${keywords.join(', ')}. ${categoryName}.`);
    }

    // 5. Vietnamese search friendly proposition  
    const viProp = `Sản phẩm ${productName}${categoryName ? ` thuộc danh mục ${categoryName}` : ''}${colors.length > 0 ? `, có màu ${colors.join(', ')}` : ''}${sizes.length > 0 ? `, sizes ${sizes.join(', ')}` : ''}${minPrice > 0 ? `, giá $${minPrice}` : ''}.`;
    propositions.push(viProp);

    return propositions;
}

/**
 * Ingest all products to Pinecone with optimized data
 */
async function ingestAllProducts() {
    try {
        console.log('🚀 Starting OPTIMIZED product ingestion to Pinecone...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Initialize Pinecone
        await initializePinecone();
        console.log('✅ Pinecone initialized');

        const index = getPineconeIndex();

        // Delete all existing vectors first
        await deleteAllVectors();

        // Get all active products
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

                // Get ALL variants (including out of stock for complete data)
                const variants = await ProductVariant.find({
                    product_id: product._id,
                    isActive: true
                }).lean();

                /**
                 * Generate rich, context-aware propositions using LLM
                 * Focuses on style, usage, and fashion advice
                 */
                async function generateAIPropositions(product, variants) {
                    try {
                        const colors = [...new Set(variants.map(v => v.color).filter(Boolean))].join(', ');
                        const materials = product.details?.material || product.description; // Simple fallback

                        const prompt = `
        Bạn là chuyên gia thời trang AI. Hãy tạo danh sách 3 mệnh đề (propositions) ngắn gọn (dưới 30 từ/câu) bằng Tiếng Việt để mô tả sản phẩm này cho hệ thống tìm kiếm (RAG).
        
        Thông tin sản phẩm:
        - Tên: ${product.name}
        - Danh mục: ${product.category?.name}
        - Thương hiệu: ${typeof product.brand === 'object' ? product.brand?.name : product.brand}
        - Màu sắc: ${colors}
        - Mô tả gốc: ${product.description?.substring(0, 300)}...

        Yêu cầu:
        1. Tập trung vào phong cách (style), dịp phù hợp để mặc (casual, party, work), và cảm giác chất liệu.
        2. Viết tự nhiên như một lời khuyên của stylist.
        3. KHÔNG bịa đặt thông tin không có.
        4. Trả về format JSON Array thuần túy: ["câu 1", "câu 2", "câu 3"]
        `;

                        const completion = await openai.chat.completions.create({
                            model: MODELS.CHAT,
                            messages: [
                                { role: "system", content: "You are a helpful fashion data assistant. Output JSON only." },
                                { role: "user", content: prompt }
                            ],
                            response_format: { type: "json_object" },
                            temperature: 0.7,
                        });

                        const content = completion.choices[0].message.content;
                        const parsed = JSON.parse(content);

                        // Handle formats like { "propositions": [...] } or just array
                        const result = Array.isArray(parsed) ? parsed : (parsed.propositions || parsed.data || []);

                        console.log(`     ✨ AI generated ${result.length} style propositions`);
                        return result;

                    } catch (error) {
                        console.error(`     ⚠️ Failed to generate AI propositions: ${error.message}`);
                        return []; // Fallback gracefully, don't stop ingestion
                    }
                }

                // ... inside ingestion function ...

                // Create optimized propositions (Rule-based)
                const ruleBasedPropositions = createOptimizedPropositions(product, variants);

                // Generate AI propositions (LLM-based)
                // Note: Using AI adds time/cost, but improves RAG quality significantly
                const aiPropositions = await generateAIPropositions(product, variants);

                // Combine both
                const propositions = [...ruleBasedPropositions, ...aiPropositions];

                console.log(`  └─ Generated ${propositions.length} total propositions (${ruleBasedPropositions.length} rules + ${aiPropositions.length} AI)`);

                // Prepare vectors with rich metadata
                const vectors = [];
                const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
                const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
                const prices = variants.map(v => v.price).filter(p => p > 0);
                const inStockVariants = variants.filter(v => v.quantity > 0);

                for (let i = 0; i < propositions.length; i++) {
                    const propText = propositions[i];
                    // Skip empty propositions
                    if (!propText) continue;

                    const embedding = await getEmbedding(propText, EMBEDDING_DIMENSIONS);

                    vectors.push({
                        id: `prod_${product._id}_prop_${i}`,
                        values: embedding,
                        metadata: {
                            type: 'product_info',
                            product_id: product._id.toString(),
                            product_name: product.name,
                            product_name_lower: product.name.toLowerCase(),
                            category: product.category?.name || '',
                            brand: typeof product.brand === 'object' ? product.brand?.name : product.brand || '',
                            colors: colors,
                            colors_lower: colors.map(c => c.toLowerCase()),
                            sizes: sizes,
                            min_price: prices.length > 0 ? Math.min(...prices) : 0,
                            max_price: prices.length > 0 ? Math.max(...prices) : 0,
                            tags: product.tags || [],
                            average_rating: product.averageRating || 0,
                            proposition_text: propText,
                            proposition_index: i,
                            is_ai_generated: i >= ruleBasedPropositions.length, // Flag to identify AI props
                            url_slug: product.urlSlug || '',
                            in_stock: inStockVariants.length > 0,
                            total_stock: inStockVariants.reduce((sum, v) => sum + v.quantity, 0)
                        }
                    });

                    // Small delay between embeddings to avoid rate limit
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                // Upsert to Pinecone in batches
                const BATCH_SIZE = 100;
                for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
                    const batch = vectors.slice(i, i + BATCH_SIZE);
                    await index.upsert(batch);
                }

                console.log(`  ✅ Upserted ${vectors.length} vectors\n`);

                totalVectors += vectors.length;
                successCount++;

                // Delay to avoid rate limit
                await new Promise(resolve => setTimeout(resolve, 200));

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

        // Verify by getting index stats
        try {
            const stats = await index.describeIndexStats();
            console.log(`\n📊 Pinecone Index Stats:`);
            console.log(`   Total vectors: ${stats.totalRecordCount || 'N/A'}`);
        } catch (e) {
            // Stats might not be available immediately
        }

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
