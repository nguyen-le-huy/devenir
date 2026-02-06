/**
 * Product Knowledge Service - Enterprise Domain Intelligence
 * Provides deep product context beyond basic database fields
 */

import Product from '../../../models/ProductModel.js';
import ProductVariant from '../../../models/ProductVariantModel.js';

export class ProductKnowledgeService {
    constructor() {
        // In-memory cache for product knowledge
        this.cache = new Map();
        this.cacheTTL = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Get comprehensive product knowledge
     * @param {string} productId - Product ID
     * @param {string} productName - Product name (optional, for logging)
     * @returns {Promise<Object>} Product knowledge object
     */
    async getProductKnowledge(productId, productName = null) {
        try {
            // Check cache first
            const cached = this.cache.get(productId);
            if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
                console.log(`📦 Using cached knowledge for: ${productName || productId}`);
                return cached.knowledge;
            }

            console.log(`🔍  Generating knowledge for: ${productName || productId}`);

            // 1. Get base product data from database
            const product = await Product.findById(productId)
                .populate('category')
                .lean();

            if (!product) {
                console.warn(`⚠️ Product not found: ${productId}`);
                return this.getDefaultKnowledge();
            }

            // 2. Get category-specific intelligence
            const categoryKnowledge = this.getCategoryKnowledge(product.category?.name);

            // 3. Analyze material properties from description
            const materialProps = this.analyzeMaterial(product.description);

            // 4. Detect style and seasonality
            const styleInfo = this.analyzeStyle(product);

            // 5. Get fit intelligence (if available from reviews/returns)
            const fitIntelligence = await this.getFitIntelligence(productId);

            // 6. Extract care instructions
            const careInfo = this.extractCareInstructions(product.description);

            // 7. Combine into comprehensive knowledge object
            const knowledge = {
                product_id: productId,
                product_name: product.name,

                // Material Intelligence
                material: materialProps.material,
                materialType: materialProps.type, // 'natural', 'synthetic', 'blend'
                hasStretch: materialProps.hasStretch,
                stretchPercentage: materialProps.stretchPercentage,
                breathability: materialProps.breathability,
                warmth: materialProps.warmth,

                // Fit Intelligence
                fitType: categoryKnowledge.defaultFit,
                fitTolerance: categoryKnowledge.fitTolerance,
                criticalMeasurement: categoryKnowledge.criticalMeasurement,
                sizingAdvice: categoryKnowledge.sizingGuide,
                fitFeedback: fitIntelligence.userFeedback,

                // Care & Maintenance
                careInstructions: careInfo.primary,
                shrinkage: materialProps.shrinkage,
                durability: materialProps.durability,
                careComplexity: careInfo.complexity,

                // Style Intelligence
                styleCategory: styleInfo.category,
                seasonality: styleInfo.season,
                formality: styleInfo.formality,
                versatility: styleInfo.versatility,

                // Designer/Brand Notes
                specialNotes: this.extractDesignerNotes(product.description),
                designerIntent: this.extractDesignerIntent(product.description, product.category?.name),

                // Quality Indicators
                pricePoint: this.categorizePricePoint(product),
                qualityTier: this.assessQualityTier(product, materialProps),

                // Metadata
                generated_at: new Date(),
                confidence: this.calculateKnowledgeConfidence(product, materialProps)
            };

            // Cache the result
            this.cache.set(productId, {
                knowledge,
                timestamp: Date.now()
            });

            console.log(`✅ Knowledge generated for ${product.name}: ${knowledge.material}, ${knowledge.fitType}, ${knowledge.seasonality}`);

            return knowledge;

        } catch (error) {
            console.error('Product Knowledge Error:', error);
            return this.getDefaultKnowledge();
        }
    }

    /**
     * Get category-specific sizing knowledge
     */
    getCategoryKnowledge(categoryName) {
        const knowledgeBase = {
            'Outerwear': {
                defaultFit: 'Regular fit with layering room',
                sizingGuide: 'Size to accommodate thick sweaters underneath. Outerwear should feel comfortable when raising arms.',
                criticalMeasurement: 'shoulder_width',
                fitTolerance: 'size_up_if_between',
                alterationDifficulty: 'high',
                fitPriority: ['shoulders', 'chest', 'length', 'sleeves']
            },
            'Knitwear': {
                defaultFit: 'Slim to regular depending on weave',
                sizingGuide: 'Knitwear has natural give. Size down if between sizes for better drape unless explicitly oversized style.',
                criticalMeasurement: 'chest',
                fitTolerance: 'true_to_size',
                alterationDifficulty: 'medium',
                fitPriority: ['chest', 'shoulders', 'length', 'sleeves']
            },
            'Shirts': {
                defaultFit: 'Tailored fit',
                sizingGuide: 'Collar must be exact - should fit one finger between neck and fabric. Shoulders are non-negotiable.',
                criticalMeasurement: 'neck_and_shoulder',
                fitTolerance: 'exact_size',
                alterationDifficulty: 'low',
                fitPriority: ['collar', 'shoulders', 'chest', 'sleeve_length']
            },
            'Pants': {
                defaultFit: 'Tailored to slim',
                sizingGuide: 'Waist is critical. Inseam can be hemmed. Consider rise (low/mid/high) for comfort.',
                criticalMeasurement: 'waist',
                fitTolerance: 'exact_size',
                alterationDifficulty: 'low',
                fitPriority: ['waist', 'hip', 'inseam', 'rise']
            },
            'Accessories': {
                defaultFit: 'One size or measured',
                sizingGuide: 'Most accessories are one-size-fits-all or require specific measurements.',
                criticalMeasurement: 'varies',
                fitTolerance: 'flexible',
                alterationDifficulty: 'varies',
                fitPriority: []
            }
        };

        return knowledgeBase[categoryName] || {
            defaultFit: 'Regular fit',
            sizingGuide: 'Standard sizing - refer to measurements chart',
            criticalMeasurement: 'chest_and_shoulders',
            fitTolerance: 'true_to_size',
            alterationDifficulty: 'medium',
            fitPriority: ['overall_proportions']
        };
    }

    /**
     * Analyze material composition and properties
     */
    analyzeMaterial(description = '') {
        const desc = description.toLowerCase();

        // Material detection patterns
        const materials = {
            // Natural fibers
            'cashmere': { type: 'natural', warmth: 'high', breathability: 'medium', luxury: true },
            'merino': { type: 'natural', warmth: 'high', breathability: 'high', luxury: true },
            'wool': { type: 'natural', warmth: 'high', breathability: 'medium', luxury: false },
            'alpaca': { type: 'natural', warmth: 'very_high', breathability: 'medium', luxury: true },
            'cotton': { type: 'natural', warmth: 'low', breathability: 'very_high', luxury: false },
            'linen': { type: 'natural', warmth: 'very_low', breathability: 'very_high', luxury: false },
            'silk': { type: 'natural', warmth: 'low', breathability: 'high', luxury: true },

            // Synthetic/Technical
            'polyester': { type: 'synthetic', warmth: 'medium', breathability: 'low', luxury: false },
            'nylon': { type: 'synthetic', warmth: 'low', breathability: 'medium', luxury: false },
            'acrylic': { type: 'synthetic', warmth: 'medium', breathability: 'low', luxury: false },

            // Stretch
            'elastane': { type: 'synthetic', stretch: true },
            'spandex': { type: 'synthetic', stretch: true },
            'elastic': { type: 'synthetic', stretch: true }
        };

        let detectedMaterial = 'Premium fabric blend';
        let materialType = 'blend';
        let warmth = 'medium';
        let breathability = 'medium';
        let isLuxury = false;

        // Detect primary material
        for (const [mat, props] of Object.entries(materials)) {
            if (desc.includes(mat)) {
                detectedMaterial = this.capitalizeMaterial(mat);
                materialType = props.type || 'unknown';
                warmth = props.warmth || 'medium';
                breathability = props.breathability || 'medium';
                isLuxury = props.luxury || false;
                break;
            }
        }

        // Detect stretch
        const hasStretch = /stretch|elastane|spandex|elastic/i.test(desc);
        const stretchMatch = desc.match(/(\d+)%?\s*(elastane|spandex|elastic)/i);
        const stretchPercentage = stretchMatch ? parseInt(stretchMatch[1]) : (hasStretch ? 5 : 0);

        // Assess shrinkage risk
        let shrinkage = 'Minimal shrinkage (<2%) with proper care';
        if (/wool|cotton/i.test(desc)) {
            shrinkage = 'May shrink 2-3% if not cared for properly (avoid hot water/dryer)';
        }
        if (/pre-shrunk|sanforized/i.test(desc)) {
            shrinkage = 'Pre-treated fabric - negligible shrinkage';
        }

        // Assess durability
        let durability = 'medium';
        if (isLuxury) durability = 'medium_to_high'; // Luxury often = delicate
        if (/cotton|nylon|polyester/i.test(desc)) durability = 'high';
        if (/silk|linen/i.test(desc)) durability = 'medium_to_low';

        return {
            material: detectedMaterial,
            type: materialType,
            hasStretch,
            stretchPercentage,
            warmth,
            breathability,
            shrinkage,
            durability,
            isLuxury
        };
    }

    /**
     * Capitalize material name properly
     */
    capitalizeMaterial(material) {
        const special = {
            'merino': 'Merino wool',
            'alpaca': 'Alpaca wool',
            'cashmere': 'Cashmere',
            'wool': 'Wool blend',
            'cotton': 'Cotton',
            'linen': 'Linen',
            'silk': 'Silk'
        };

        return special[material.toLowerCase()] || material.charAt(0).toUpperCase() + material.slice(1);
    }

    /**
     * Analyze style characteristics
     */
    analyzeStyle(product) {
        const name = (product.name || '').toLowerCase();
        const desc = (product.description || '').toLowerCase();
        const combined = name + ' ' + desc;

        // Seasonality detection
        let season = 'All-season';
        if (/summer|lightweight|linen/i.test(combined)) season = 'Spring/Summer';
        if (/winter|wool|cashmere|heavy|insulated/i.test(combined)) season = 'Fall/Winter';
        if (/transitional|mid-weight|versatile/i.test(combined)) season = 'Transitional (Spring/Fall)';

        // Style category
        let category = 'Classic';
        if (/minimal|clean|simple/i.test(combined)) category = 'Minimalist';
        if (/luxury|premium|designer/i.test(combined)) category = 'Luxury';
        if (/casual|relaxed|everyday/i.test(combined)) category = 'Casual';
        if (/formal|business|tailored/i.test(combined)) category = 'Formal';
        if (/streetwear|urban|contemporary/i.test(combined)) category = 'Contemporary';

        // Formality level
        let formality = 'smart_casual';
        if (/formal|business|suit|blazer/i.test(combined)) formality = 'formal';
        if (/casual|t-shirt|jeans/i.test(combined)) formality = 'casual';
        if (/dress shirt|polo|chinos/i.test(combined)) formality = 'smart_casual';

        // Versatility (how many occasions it suits)
        let versatility = 'medium';
        if (/versatile|everyday|essential/i.test(combined)) versatility = 'high';
        if (/occasion|statement|special/i.test(combined)) versatility = 'low';

        return {
            season,
            category,
            formality,
            versatility
        };
    }

    /**
     * Extract care instructions
     */
    extractCareInstructions(description = '') {
        const desc = description.toLowerCase();

        let primary = 'Professional care recommended';
        let complexity = 'medium';

        if (/dry clean only|professional clean/i.test(desc)) {
            primary = 'Dry clean only';
            complexity = 'high';
        } else if (/hand wash|gentle wash/i.test(desc)) {
            primary = 'Hand wash in cold water recommended';
            complexity = 'medium';
        } else if (/machine wash|washable/i.test(desc)) {
            primary = 'Machine washable (gentle cycle, cold water)';
            complexity = 'low';
        }

        return { primary, complexity };
    }

    /**
     * Extract designer notes from description
     */
    extractDesignerNotes(description = '') {
        // Look for quoted text or special styling notes
        const quoteMatch = description.match(/"([^"]+)"/);
        if (quoteMatch) return quoteMatch[1];

        // Look for key phrases
        const notePatterns = [
            /designer notes?:?\s*([^.]+)/i,
            /inspiration:?\s*([^.]+)/i,
            /this piece:?\s*([^.]+)/i
        ];

        for (const pattern of notePatterns) {
            const match = description.match(pattern);
            if (match) return match[1].trim();
        }

        return null;
    }

    /**
     * Extract designer intent (how piece should be worn)
     */
    extractDesignerIntent(description = '', category = '') {
        const desc = description.toLowerCase();

        if (/oversized|relaxed|loose/i.test(desc)) {
            return 'Designed for an oversized, relaxed silhouette';
        }
        if (/slim|fitted|tailored/i.test(desc)) {
            return 'Designed for a slim, tailored fit close to the body';
        }
        if (/layer/i.test(desc)) {
            return 'Designed as a layering piece';
        }
        if (/statement|bold|standout/i.test(desc)) {
            return 'Designed as a statement piece - focal point of outfit';
        }

        // Category defaults
        if (category === 'Outerwear') return 'Designed for layering over other garments';
        if (category === 'Shirts') return 'Designed for a sharp, put-together look';

        return 'Designed for versatile, everyday wear';
    }

    /**
     * Get fit intelligence from user feedback (if available)
     */
    async getFitIntelligence(productId) {
        // TODO: Integrate with review system when available
        // For now, return neutral feedback

        try {
            // Future: Query reviews/returns for this product
            // const reviews = await Review.find({ product_id: productId });
            // Analyze sentiment and fit comments

            return {
                userFeedback: 'True to size', // or 'Runs small', 'Runs large', 'Size up recommended'
                returnRate: null,
                fitComplaintRate: null,
                confidence: 0.5
            };

        } catch (error) {
            return {
                userFeedback: 'True to size',
                returnRate: null,
                fitComplaintRate: null,
                confidence: 0.5
            };
        }
    }

    /**
     * Categorize price point for context
     */
    categorizePricePoint(product) {
        // Get min price from product or variants
        const price = product.minPrice || product.price || 0;

        if (price < 50) return 'accessible';
        if (price < 150) return 'mid_range';
        if (price < 300) return 'premium';
        return 'luxury';
    }

    /**
     * Assess overall quality tier
     */
    assessQualityTier(product, materialProps) {
        let tier = 'standard';

        // Luxury materials boost tier
        if (materialProps.isLuxury) tier = 'premium';

        // Price consideration
        const pricePoint = this.categorizePricePoint(product);
        if (pricePoint === 'luxury') tier = 'luxury';
        if (pricePoint === 'premium' && materialProps.isLuxury) tier = 'luxury';

        return tier;
    }

    /**
     * Calculate confidence score for knowledge
     */
    calculateKnowledgeConfidence(product, materialProps) {
        let score = 0.5; // Base

        // Has detailed description
        if (product.description && product.description.length > 100) score += 0.2;

        // Material detected
        if (materialProps.material !== 'Premium fabric blend') score += 0.15;

        // Has category
        if (product.category) score += 0.15;

        return Math.min(score, 1.0);
    }

    /**
     * Get default knowledge when product not found
     */
    getDefaultKnowledge() {
        return {
            material: 'Premium fabric',
            hasStretch: false,
            fitType: 'Regular fit',
            seasonality: 'All-season',
            careInstructions: 'Follow care label',
            shrinkage: 'Minimal with proper care',
            confidence: 0.3
        };
    }

    /**
     * Clear knowledge cache
     */
    clearCache(productId = null) {
        if (productId) {
            this.cache.delete(productId);
            console.log(`🧹 Cleared cache for product: ${productId}`);
        } else {
            this.cache.clear();
            console.log('🧹 Cleared all product knowledge cache');
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            ttl_minutes: this.cacheTTL / 60000,
            items: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
export const productKnowledgeService = new ProductKnowledgeService();
