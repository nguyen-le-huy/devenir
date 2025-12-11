/**
 * Self-hosted Image Search Controller
 * Sử dụng: CLIP Service (self-hosted) + Qdrant + Redis
 * 
 * Flow:
 * 1. Check Redis cache (5ms)
 * 2. Encode image via CLIP service (200-300ms)
 * 3. Search Qdrant (30-50ms)
 * 4. Cache results async
 * 5. Return results (NO MongoDB needed - payload from Qdrant)
 */

import asyncHandler from 'express-async-handler';
import { encodeImage, checkClipHealth } from '../services/imageSearch/clipServiceClient.js';
import {
    initQdrant,
    searchSimilar,
    getCollectionStats
} from '../services/imageSearch/qdrantVectorStore.js';
import {
    initRedisCache,
    getCachedResults,
    cacheResults,
    generateImageHash,
    getCacheStats,
    isRedisAvailable
} from '../services/imageSearch/redisCache.js';

// Track initialization
let servicesInitialized = false;

/**
 * Initialize all services
 */
async function ensureInitialized() {
    if (servicesInitialized) return;

    console.log('🔧 Initializing self-hosted image search services...');

    try {
        // Init Qdrant
        await initQdrant();

        // Init Redis (optional - fallback without cache)
        await initRedisCache();

        servicesInitialized = true;
        console.log('✅ All services initialized');
    } catch (error) {
        console.error('⚠️ Service init error:', error.message);
        // Continue even if Redis fails
        servicesInitialized = true;
    }
}

/**
 * @desc    Find similar products by image (Self-hosted version)
 * @route   POST /api/image-search/find-similar-selfhost
 * @access  Public
 */
export const findSimilarProductsSelfHost = asyncHandler(async (req, res) => {
    const { image, topK = 12, scoreThreshold = 0.15 } = req.body;  // Lower threshold for background images

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

    // Initialize services
    await ensureInitialized();

    const timing = {
        cacheCheck: 0,
        clipEncode: 0,
        qdrantSearch: 0,
        total: 0
    };

    const totalStart = Date.now();

    try {
        // Step 1: Check Redis cache
        const cacheStart = Date.now();
        const imageHash = generateImageHash(image);
        const cachedResults = await getCachedResults(imageHash);
        timing.cacheCheck = Date.now() - cacheStart;

        if (cachedResults) {
            timing.total = Date.now() - totalStart;
            return res.status(200).json({
                success: true,
                data: cachedResults,
                count: cachedResults.length,
                cached: true,
                timing
            });
        }

        // Step 2: Encode image via CLIP service
        console.log('🔍 Encoding image via CLIP service...');
        const clipStart = Date.now();
        const { embedding, processingTime } = await encodeImage(image);
        timing.clipEncode = Date.now() - clipStart;

        if (!embedding || embedding.length !== 768) {  // ViT-L-14 outputs 768 dims
            throw new Error('Failed to generate valid embedding');
        }

        console.log(`✅ CLIP embedding generated in ${processingTime}ms`);

        // Step 3: Search Qdrant
        console.log('🔍 Searching similar images in Qdrant...');
        const qdrantStart = Date.now();
        const matches = await searchSimilar(embedding, parseInt(topK), parseFloat(scoreThreshold));
        timing.qdrantSearch = Date.now() - qdrantStart;

        if (matches.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0,
                message: 'No similar products found',
                timing
            });
        }

        // Step 4: Format results (NO MongoDB needed - data from Qdrant payload)
        const results = matches.map(match => ({
            variantId: match.variantId || match.id,
            score: match.score,
            similarity: match.similarity,
            productName: match.productName,
            color: match.color,
            price: match.price,
            mainImage: match.mainImage,
            hoverImage: match.hoverImage || match.mainImage,
            size: match.size,
            sku: match.sku,
            inStock: match.inStock !== false,
            urlSlug: match.urlSlug
        }));

        // Step 5: Cache results async (don't await)
        cacheResults(imageHash, results).catch(err =>
            console.error('Cache write error:', err.message)
        );

        timing.total = Date.now() - totalStart;

        console.log(`✅ Found ${results.length} similar products in ${timing.total}ms`);

        res.status(200).json({
            success: true,
            data: results,
            count: results.length,
            cached: false,
            timing
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
 * @desc    Get self-hosted service stats
 * @route   GET /api/image-search/stats-selfhost
 * @access  Private/Admin
 */
export const getSelfHostStats = asyncHandler(async (req, res) => {
    await ensureInitialized();

    const [qdrantStats, cacheStats, clipHealth] = await Promise.all([
        getCollectionStats(),
        getCacheStats(),
        checkClipHealth()
    ]);

    res.status(200).json({
        success: true,
        data: {
            qdrant: qdrantStats,
            redis: cacheStats,
            clip: clipHealth || { available: false }
        }
    });
});

/**
 * @desc    Health check for self-hosted image search
 * @route   GET /api/image-search/health-selfhost
 * @access  Public
 */
export const selfHostHealth = asyncHandler(async (req, res) => {
    const checks = {
        qdrant: false,
        redis: false,
        clip: false,
        initialized: servicesInitialized
    };

    try {
        // Check CLIP
        const clipHealth = await checkClipHealth();
        checks.clip = clipHealth !== null;

        // Check Qdrant
        const qdrantStats = await getCollectionStats();
        checks.qdrant = !qdrantStats.error;

        // Check Redis
        checks.redis = isRedisAvailable();
    } catch (error) {
        console.error('Health check error:', error.message);
    }

    const allOk = checks.clip && checks.qdrant;

    res.status(allOk ? 200 : 503).json({
        success: allOk,
        status: allOk ? 'healthy' : 'degraded',
        checks,
        note: checks.redis ? 'Cache enabled' : 'Running without cache'
    });
});
