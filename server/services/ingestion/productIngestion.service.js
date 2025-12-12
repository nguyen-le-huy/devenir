/**
 * Product Ingestion Service
 * 
 * Auto-ingests products when created/updated:
 * 1. Pinecone (RAG - text embeddings)
 * 2. Qdrant (Visual Search - image embeddings)
 * 
 * Runs async in background - doesn't block API responses
 */

import Product from '../../models/ProductModel.js';
import ProductVariant from '../../models/ProductVariantModel.js';
import { initializePinecone, getPineconeIndex } from '../../config/pinecone.js';
import { createProductPropositions, createSimpleChunks } from '../rag/embeddings/proposition.service.js';
import { getEmbedding } from '../rag/embeddings/embedding.service.js';
import { initQdrant, upsertVectors, mongoIdToUuid } from '../imageSearch/qdrantVectorStore.js';
import { encodeImage, checkClipHealth } from '../imageSearch/clipServiceClient.js';

// Constants
const PINECONE_EMBEDDING_DIMENSIONS = 1536;

/**
 * Check if services are available
 */
async function checkServices() {
    const status = { pinecone: false, qdrant: false };
    
    try {
        await initializePinecone();
        status.pinecone = true;
    } catch (error) {
        console.warn('⚠️ Pinecone not available:', error.message);
    }
    
    try {
        const clipHealth = await checkClipHealth();
        if (clipHealth) {
            await initQdrant();
            status.qdrant = true;
        }
    } catch (error) {
        console.warn('⚠️ Qdrant/CLIP not available:', error.message);
    }
    
    return status;
}

/**
 * Ingest a single product to Pinecone (RAG)
 * @param {String} productId - MongoDB Product ID
 * @returns {Promise<{success: boolean, vectorCount: number}>}
 */
export async function ingestProductToPinecone(productId) {
    try {
        console.log(`📝 [Pinecone] Ingesting product: ${productId}`);
        
        // Initialize Pinecone
        await initializePinecone();
        const index = getPineconeIndex();
        
        // Fetch product with category populated
        const product = await Product.findById(productId)
            .populate('category')
            .lean();
        
        if (!product) {
            console.warn(`⚠️ [Pinecone] Product not found: ${productId}`);
            return { success: false, vectorCount: 0, error: 'Product not found' };
        }
        
        // Skip if not active/published
        if (!product.isActive || product.status !== 'published') {
            console.log(`⏭️ [Pinecone] Skipping inactive product: ${product.name}`);
            return { success: true, vectorCount: 0, skipped: true };
        }
        
        // Get variants
        const variants = await ProductVariant.find({
            product_id: product._id,
            isActive: true
        }).lean();
        
        // Generate propositions
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
            const embedding = await getEmbedding(propText, PINECONE_EMBEDDING_DIMENSIONS);
            
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
            const sizeColorEmbedding = await getEmbedding(sizeColorInfo, PINECONE_EMBEDDING_DIMENSIONS);
            
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
        console.log(`  ✅ [Pinecone] Upserted ${vectors.length} vectors for ${product.name}`);
        
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error(`❌ [Pinecone] Ingestion error for ${productId}:`, error.message);
        return { success: false, vectorCount: 0, error: error.message };
    }
}

/**
 * Delete product vectors from Pinecone
 * @param {String} productId - MongoDB Product ID
 */
export async function deleteProductFromPinecone(productId) {
    try {
        console.log(`🗑️ [Pinecone] Deleting vectors for product: ${productId}`);
        
        await initializePinecone();
        const index = getPineconeIndex();
        
        // Pinecone requires deleting by ID prefix (approximation)
        // We'll delete known patterns: prod_{id}_prop_{n} and prod_{id}_variants_info
        const idsToDelete = [];
        
        // Delete proposition vectors (assume max 15 propositions)
        for (let i = 0; i < 15; i++) {
            idsToDelete.push(`prod_${productId}_prop_${i}`);
        }
        idsToDelete.push(`prod_${productId}_variants_info`);
        
        await index.deleteMany(idsToDelete);
        
        console.log(`  ✅ [Pinecone] Deleted vectors for product ${productId}`);
        return { success: true };
        
    } catch (error) {
        console.error(`❌ [Pinecone] Delete error for ${productId}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Ingest variants to Qdrant (Visual Search)
 * @param {Array<String>} variantIds - MongoDB Variant IDs
 * @returns {Promise<{success: boolean, vectorCount: number}>}
 */
export async function ingestVariantsToQdrant(variantIds) {
    try {
        if (!variantIds || variantIds.length === 0) {
            return { success: true, vectorCount: 0, skipped: true };
        }
        
        console.log(`📸 [Qdrant] Ingesting ${variantIds.length} variants`);
        
        // Check CLIP service health
        const clipHealth = await checkClipHealth();
        if (!clipHealth) {
            console.warn('⚠️ [Qdrant] CLIP service not available, skipping visual search ingestion');
            return { success: false, vectorCount: 0, error: 'CLIP service unavailable' };
        }
        
        // Initialize Qdrant
        await initQdrant();
        
        // Fetch variants with product info
        const variants = await ProductVariant.find({ _id: { $in: variantIds } })
            .populate('product_id', 'name category description urlSlug')
            .lean();
        
        // Filter variants with images
        const variantsWithImages = variants.filter(v => v.mainImage);
        
        if (variantsWithImages.length === 0) {
            console.log('⏭️ [Qdrant] No variants with images to ingest');
            return { success: true, vectorCount: 0, skipped: true };
        }
        
        const vectors = [];
        
        for (const variant of variantsWithImages) {
            try {
                // Encode image via CLIP
                const { embedding } = await encodeImage(variant.mainImage);
                
                vectors.push({
                    id: mongoIdToUuid(variant._id.toString()),
                    vector: embedding,
                    payload: {
                        variantId: variant._id.toString(),
                        productId: variant.product_id?._id?.toString(),
                        productName: variant.product_id?.name || 'Unknown Product',
                        color: variant.color,
                        size: variant.size,
                        price: variant.price,
                        sku: variant.sku || '',
                        mainImage: variant.mainImage,
                        hoverImage: variant.hoverImage || variant.mainImage,
                        urlSlug: variant.product_id?.urlSlug || '',
                        inStock: variant.quantity > 0,
                        quantity: variant.quantity,
                        indexedAt: new Date().toISOString()
                    }
                });
            } catch (encodeError) {
                console.warn(`  ⚠️ Failed to encode variant ${variant._id}:`, encodeError.message);
            }
        }
        
        if (vectors.length > 0) {
            await upsertVectors(vectors);
            console.log(`  ✅ [Qdrant] Upserted ${vectors.length} vectors`);
        }
        
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error(`❌ [Qdrant] Ingestion error:`, error.message);
        return { success: false, vectorCount: 0, error: error.message };
    }
}

/**
 * Delete variants from Qdrant
 * @param {Array<String>} variantIds - MongoDB Variant IDs
 */
export async function deleteVariantsFromQdrant(variantIds) {
    try {
        if (!variantIds || variantIds.length === 0) {
            return { success: true };
        }
        
        console.log(`🗑️ [Qdrant] Deleting ${variantIds.length} variants`);
        
        await initQdrant();
        const { getQdrant, QDRANT_COLLECTION } = await import('../imageSearch/qdrantVectorStore.js');
        const client = getQdrant();
        
        // Convert MongoDB IDs to UUIDs
        const uuids = variantIds.map(id => mongoIdToUuid(id.toString()));
        
        await client.delete(QDRANT_COLLECTION, {
            points: uuids
        });
        
        console.log(`  ✅ [Qdrant] Deleted ${variantIds.length} vectors`);
        return { success: true };
        
    } catch (error) {
        console.error(`❌ [Qdrant] Delete error:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Full ingestion for a product (both Pinecone + Qdrant)
 * Runs in background - doesn't await
 * @param {String} productId - MongoDB Product ID
 * @param {Array<String>} variantIds - MongoDB Variant IDs (optional)
 */
export function triggerProductIngestion(productId, variantIds = []) {
    // Run in background - don't block the API response
    setImmediate(async () => {
        console.log(`\n🚀 [Auto-Ingest] Starting ingestion for product: ${productId}`);
        
        const services = await checkServices();
        
        // Ingest to Pinecone (RAG)
        if (services.pinecone) {
            await ingestProductToPinecone(productId);
        }
        
        // Ingest to Qdrant (Visual Search)
        if (services.qdrant && variantIds.length > 0) {
            await ingestVariantsToQdrant(variantIds);
        }
        
        console.log(`✅ [Auto-Ingest] Completed for product: ${productId}\n`);
    });
}

/**
 * Full deletion for a product (both Pinecone + Qdrant)
 * Runs in background - doesn't await
 * @param {String} productId - MongoDB Product ID
 * @param {Array<String>} variantIds - MongoDB Variant IDs
 */
export function triggerProductDeletion(productId, variantIds = []) {
    // Run in background
    setImmediate(async () => {
        console.log(`\n🗑️ [Auto-Delete] Starting deletion for product: ${productId}`);
        
        const services = await checkServices();
        
        if (services.pinecone) {
            await deleteProductFromPinecone(productId);
        }
        
        if (services.qdrant && variantIds.length > 0) {
            await deleteVariantsFromQdrant(variantIds);
        }
        
        console.log(`✅ [Auto-Delete] Completed for product: ${productId}\n`);
    });
}

export default {
    ingestProductToPinecone,
    deleteProductFromPinecone,
    ingestVariantsToQdrant,
    deleteVariantsFromQdrant,
    triggerProductIngestion,
    triggerProductDeletion
};
