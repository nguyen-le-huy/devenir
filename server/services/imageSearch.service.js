import { encodeImage, checkClipHealth } from './imageSearch/clipServiceClient.js';
import {
    initQdrant,
    searchSimilar,
    getCollectionStats,
    isQdrantAvailable
} from './imageSearch/qdrantVectorStore.js';
import {
    initRedisCache,
    getCachedResults,
    cacheResults,
    generateImageHash,
    getCacheStats,
    isRedisAvailable
} from './imageSearch/redisCache.js';

class ImageSearchService {
    constructor() {
        this.servicesInitialized = false;
    }

    /**
     * Initialize all services
     */
    async ensureInitialized() {
        if (this.servicesInitialized) return;

        console.log('🔧 Initializing self-hosted image search services...');

        try {
            // Init Qdrant
            await initQdrant();

            // Init Redis (optional - fallback without cache)
            await initRedisCache();

            this.servicesInitialized = true;
            console.log('✅ All services initialized');
        } catch (error) {
            console.error('⚠️ Service init error:', error.message);
            // Continue even if Redis fails
            this.servicesInitialized = true;
        }
    }

    /**
     * Search similar products by image
     */
    async findSimilarProducts(image, topK = 12, scoreThreshold = 0.15) {
        // Initialize services
        await this.ensureInitialized();

        // Check if Qdrant is available
        if (!isQdrantAvailable()) {
            throw new Error('Visual search service unavailable. Qdrant server is not running.');
        }

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
                return {
                    results: cachedResults,
                    cached: true,
                    timing
                };
            }

            // Step 2: Encode image via CLIP service
            console.log('🔍 Encoding image via CLIP service...');
            const clipStart = Date.now();
            const { embedding, processingTime } = await encodeImage(image);
            timing.clipEncode = Date.now() - clipStart;

            if (!embedding || embedding.length !== 512) {
                throw new Error('Failed to generate valid embedding');
            }

            console.log(`✅ CLIP embedding generated in ${processingTime}ms`);

            // Step 3: Search Qdrant
            console.log('🔍 Searching similar images in Qdrant...');
            const qdrantStart = Date.now();
            const matches = await searchSimilar(embedding, parseInt(topK), parseFloat(scoreThreshold));
            timing.qdrantSearch = Date.now() - qdrantStart;

            if (matches.length === 0) {
                return {
                    results: [],
                    cached: false,
                    message: 'No similar products found',
                    timing
                };
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

            return {
                results,
                cached: false,
                timing
            };

        } catch (error) {
            console.error('❌ Image search service error:', error);
            throw error;
        }
    }

    /**
     * Get self-hosted service stats
     */
    async getSelfHostStats() {
        await this.ensureInitialized();

        const [qdrantStats, cacheStats, clipHealth] = await Promise.all([
            getCollectionStats(),
            getCacheStats(),
            checkClipHealth()
        ]);

        return {
            qdrant: qdrantStats,
            redis: cacheStats,
            clip: clipHealth || { available: false }
        };
    }

    /**
     * Health check for self-hosted image search
     */
    async selfHostHealth() {
        const checks = {
            qdrant: false,
            redis: false,
            clip: false,
            initialized: this.servicesInitialized
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

        return {
            healthy: allOk,
            status: allOk ? 'healthy' : 'degraded',
            checks,
            note: checks.redis ? 'Cache enabled' : 'Running without cache'
        };
    }
}

export default new ImageSearchService();
