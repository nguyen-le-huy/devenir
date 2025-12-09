import asyncHandler from 'express-async-handler';
import { getImageEmbeddingFromBase64 } from '../services/imageSearch/clipEmbedding.js';
import {
    initImageVectorStore,
    searchSimilarImages,
    getImageIndexStats
} from '../services/imageSearch/imageVectorStore.js';
import ProductVariant from '../models/ProductVariantModel.js';

// Initialize on first request
let initialized = false;

/**
 * @desc    Find similar products by image
 * @route   POST /api/image-search/find-similar
 * @access  Public
 */
export const findSimilarProducts = asyncHandler(async (req, res) => {
    const { image, topK = 8 } = req.body;

    if (!image) {
        return res.status(400).json({
            success: false,
            message: 'Image is required (base64 format)'
        });
    }

    // Validate image size (max 10MB base64)
    if (image.length > 10 * 1024 * 1024) {
        return res.status(400).json({
            success: false,
            message: 'Image too large. Maximum size is 10MB'
        });
    }

    // Initialize vector store if needed
    if (!initialized) {
        await initImageVectorStore();
        initialized = true;
    }

    try {
        console.log('🔍 Generating CLIP embedding for uploaded image...');
        const startTime = Date.now();

        // Get CLIP embedding for uploaded image
        const queryEmbedding = await getImageEmbeddingFromBase64(image);

        if (!queryEmbedding || queryEmbedding.length !== 512) {
            throw new Error('Failed to generate valid embedding');
        }

        console.log(`✅ Embedding generated in ${Date.now() - startTime}ms`);

        // Search similar images in Pinecone
        console.log('🔍 Searching similar images in Pinecone...');
        const matches = await searchSimilarImages(queryEmbedding, parseInt(topK));

        if (matches.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0,
                message: 'No similar products found'
            });
        }

        // Get variant IDs from matches
        const variantIds = matches.map(m => m.id);

        // Fetch full variant data from MongoDB
        const variants = await ProductVariant.find({ _id: { $in: variantIds } })
            .populate('product_id', 'name category description urlSlug')
            .lean();

        // Map results with similarity scores
        const results = matches.map(match => {
            const variant = variants.find(v => v._id.toString() === match.id);

            return {
                variantId: match.id,
                score: match.score,
                similarity: Math.round(match.score * 100),
                // Metadata from Pinecone
                productName: match.metadata?.productName || variant?.product_id?.name || 'Unknown',
                color: match.metadata?.color || variant?.color,
                price: match.metadata?.price || variant?.price,
                mainImage: match.metadata?.mainImage || variant?.mainImage,
                hoverImage: variant?.hoverImage || variant?.mainImage, // Add hoverImage
                // Additional variant data if available
                size: variant?.size,
                sku: variant?.sku,
                inStock: variant?.quantity > 0,
                urlSlug: variant?.product_id?.urlSlug
            };
        });

        console.log(`✅ Found ${results.length} similar products`);

        res.status(200).json({
            success: true,
            data: results,
            count: results.length
        });

    } catch (error) {
        console.error('❌ Image search error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Image search failed'
        });
    }
});

/**
 * @desc    Get image search stats
 * @route   GET /api/image-search/stats
 * @access  Private/Admin
 */
export const getImageSearchStats = asyncHandler(async (req, res) => {
    if (!initialized) {
        await initImageVectorStore();
        initialized = true;
    }

    const stats = await getImageIndexStats();

    res.status(200).json({
        success: true,
        data: stats
    });
});

/**
 * @desc    Health check for image search service
 * @route   GET /api/image-search/health
 * @access  Public
 */
export const imageSearchHealth = asyncHandler(async (req, res) => {
    const checks = {
        openai: !!process.env.OPENAI_API_KEY,
        pinecone: !!process.env.PINECONE_API_KEY,
        indexName: process.env.PINECONE_IMAGE_INDEX_NAME || 'visual-search',
        initialized
    };

    const allOk = checks.openai && checks.pinecone;

    res.status(allOk ? 200 : 503).json({
        success: allOk,
        status: allOk ? 'healthy' : 'degraded',
        checks
    });
});
