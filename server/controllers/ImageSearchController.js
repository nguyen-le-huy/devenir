import asyncHandler from 'express-async-handler';
import imageSearchService from '../services/imageSearch.service.js';

/**
 * @desc    Find similar products by image (Self-hosted version)
 * @route   POST /api/image-search/find-similar-selfhost
 * @access  Public
 */
export const findSimilarProductsSelfHost = asyncHandler(async (req, res) => {
    const { image, topK = 12, scoreThreshold = 0.15 } = req.body;

    // Validate image size (max 10MB base64) - handled in controller before passing to service to fail fast
    if (image.length > 50 * 1024 * 1024) {
        return res.status(400).json({
            success: false,
            message: 'Image too large. Maximum size is 10MB'
        });
    }

    try {
        const result = await imageSearchService.findSimilarProducts(image, topK, scoreThreshold);

        res.status(200).json({
            success: true,
            data: result.results,
            count: result.results.length,
            cached: result.cached,
            message: result.message,
            timing: result.timing
        });
    } catch (error) {
        if (error.message.includes('unavailable')) {
            return res.status(503).json({
                success: false,
                message: error.message,
                hint: 'Start Qdrant with: docker run -d -p 6333:6333 qdrant/qdrant'
            });
        }
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
    const stats = await imageSearchService.getSelfHostStats();
    res.status(200).json({ success: true, data: stats });
});

/**
 * @desc    Health check for self-hosted image search
 * @route   GET /api/image-search/health-selfhost
 * @access  Public
 */
export const selfHostHealth = asyncHandler(async (req, res) => {
    const health = await imageSearchService.selfHostHealth();
    res.status(health.healthy ? 200 : 503).json({
        success: health.healthy,
        ...health
    });
});

/**
 * Initialize image search services (call on server startup)
 */
export const initImageSearchServices = async () => {
    try {
        await imageSearchService.ensureInitialized();
        return true;
    } catch (error) {
        console.error('❌ Failed to init image search services:', error.message);
        return false;
    }
};
