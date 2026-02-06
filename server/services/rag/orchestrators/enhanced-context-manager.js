import { ConversationManager } from './conversation-manager.js';
import { llmProvider } from '../core/LLMProvider.js';
import Product from '../../../models/ProductModel.js';

/**
 * Enhanced Context Manager - Enterprise-grade conversation context
 * Provides semantic understanding and entity extraction
 */
export class EnhancedContextManager extends ConversationManager {
    constructor() {
        super();
        this.entityCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get enhanced context with entity extraction and semantic understanding
     * @param {string} userId - User ID or session ID
     * @param {Array} recentMessages - Recent messages from client
     * @returns {Promise<Object>} Enhanced context with entities and semantics
     */
    async getContext(userId, recentMessages = []) {
        try {
            // Get base context from parent class
            const baseContext = await super.getContext(userId, recentMessages);

            // Extract structured entities from conversation
            const entities = await this.extractEntities(baseContext.history, recentMessages);

            // Build conversation summary
            const summary = this.summarizeContext(baseContext.history);

            // Enhanced context object
            const enhancedContext = {
                ...baseContext,

                // Structured entities
                entities: {
                    current_product: entities.current_product || null,
                    all_products: entities.all_products || [],
                    user_measurements: entities.user_measurements || {},
                    preferences: entities.preferences || {},
                    conversation_topic: entities.topic || 'general'
                },

                // Intent tracking
                intent_history: entities.intent_history || [],

                // Conversation summary (for context compression)
                summary: summary,

                // Metadata
                turn_count: baseContext.history.length,
                conversation_age: this.getConversationAge(baseContext.history),
                has_entities: !!(entities.current_product || entities.all_products.length > 0)
            };

            console.log(`🧠 Enhanced Context for ${userId}:`, {
                current_product: enhancedContext.entities.current_product?.name || 'None',
                all_products_count: enhancedContext.entities.all_products.length,
                topic: enhancedContext.entities.conversation_topic,
                turn_count: enhancedContext.turn_count
            });

            return enhancedContext;

        } catch (error) {
            console.error('Enhanced Context Error:', error);
            // Fallback to base context
            return super.getContext(userId, recentMessages);
        }
    }

    /**
     * Extract structured entities from conversation using LLM
     * @param {Array} dbHistory - History from database
     * @param {Array} clientMessages - Recent messages from client
     * @returns {Promise<Object>} Extracted entities
     */
    async extractEntities(dbHistory = [], clientMessages = []) {
        try {
            // Combine and format messages (prioritize recent client messages)
            const allMessages = [...dbHistory, ...clientMessages];
            if (allMessages.length === 0) {
                return this.getDefaultEntities();
            }

            // Use cache for efficiency
            const cacheKey = this.getCacheKey(allMessages);
            const cached = this.entityCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
                console.log('📦 Using cached entities');
                return cached.entities;
            }

            // Build prompt for entity extraction
            const conversationText = this.formatConversationForExtraction(allMessages);

            const prompt = `
Analyze this fashion e-commerce conversation and extract structured entities.

# Conversation:
${conversationText}

# Extraction Rules:
1. **Products**: Extract ALL mentioned products with name and ID if visible in metadata
2. **Current Product**: The MOST RECENT product the user is asking about (prioritize user's latest message)
3. **Measurements**: Height (cm), weight (kg), chest, waist if mentioned
4. **Preferences**: Colors, styles, budget, usual size
5. **Topic**: What is the main focus? Options: 'product_search', 'size_inquiry', 'style_advice', 'order_tracking', 'general'
6. **Intent History**: List of intents in chronological order

# Output Format (JSON):
{
  "current_product": {
    "name": "Product Name",
    "id": "product_id_if_available",
    "mentioned_at": "timestamp or message number"
  },
  "all_products": [
    { "name": "...", "id": "...", "mentioned_at": "..." }
  ],
  "user_measurements": {
    "height": 175,
    "weight": 70,
    "chest": null,
    "waist": null,
    "usual_size": "L"
  },
  "preferences": {
    "colors": ["black", "white"],
    "style": "minimalist",
    "budget": { "min": 50, "max": 200 }
  },
  "topic": "size_inquiry",
  "intent_history": ["product_advice", "size_recommendation"]
}

Return ONLY valid JSON, no explanations.
`;

            const result = await llmProvider.jsonCompletion([
                { role: 'system', content: 'You are an entity extraction specialist for e-commerce conversations.' },
                { role: 'user', content: prompt }
            ], {
                temperature: 0.1,
                maxTokens: 500
            });

            // Validate and enrich with database data
            const enrichedEntities = await this.enrichEntities(result);

            // Cache the result
            this.entityCache.set(cacheKey, {
                entities: enrichedEntities,
                timestamp: Date.now()
            });

            return enrichedEntities;

        } catch (error) {
            console.error('Entity Extraction Error:', error);
            return this.getDefaultEntities();
        }
    }

    /**
     * Format conversation messages for entity extraction
     */
    formatConversationForExtraction(messages) {
        return messages.slice(-10).map((msg, idx) => {
            const role = msg.role === 'user' || msg.sender === 'user' ? 'User' : 'Bot';
            const content = msg.content || msg.text || '';

            // Include metadata for products
            let metaInfo = '';
            if (msg.metadata?.suggested_products || msg.suggestedProducts) {
                const products = msg.metadata?.suggested_products || msg.suggestedProducts;
                metaInfo = `\n  [Products: ${products.map(p => `${p.name || p._id}`).join(', ')}]`;
            }

            return `[${idx + 1}] ${role}: ${content}${metaInfo}`;
        }).join('\n');
    }

    /**
     * Enrich extracted entities with database data
     */
    async enrichEntities(entities) {
        try {
            // If we have current_product name but no ID, try to find it
            if (entities.current_product?.name && !entities.current_product.id) {
                const product = await this.findProductByName(entities.current_product.name);
                if (product) {
                    entities.current_product.id = product._id.toString();
                    entities.current_product.full_data = product;
                }
            }

            // Enrich all_products similarly
            if (entities.all_products && Array.isArray(entities.all_products)) {
                for (const prod of entities.all_products) {
                    if (prod.name && !prod.id) {
                        const product = await this.findProductByName(prod.name);
                        if (product) {
                            prod.id = product._id.toString();
                            prod.full_data = product;
                        }
                    }
                }
            }

            return entities;

        } catch (error) {
            console.error('Entity Enrichment Error:', error);
            return entities;
        }
    }

    /**
     * Find product by name (with fuzzy matching)
     */
    async findProductByName(productName) {
        try {
            // Try exact match first
            let product = await Product.findOne({
                name: new RegExp(`^${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                isActive: true
            }).select('_id name urlSlug category').lean();

            if (product) return product;

            // Try partial match
            product = await Product.findOne({
                name: new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                isActive: true
            }).select('_id name urlSlug category').lean();

            return product;

        } catch (error) {
            console.error('Product Lookup Error:', error);
            return null;
        }
    }

    /**
     * Summarize conversation for context compression
     */
    summarizeContext(history) {
        if (!history || history.length === 0) {
            return 'New conversation, no prior context.';
        }

        // Simple summary for now - can be enhanced with LLM summarization
        const turnCount = history.length;
        const lastUserMsg = [...history].reverse().find(m => m.role === 'user')?.content || 'N/A';

        return `${turnCount} turns. Last user query: "${lastUserMsg.slice(0, 80)}${lastUserMsg.length > 80 ? '...' : ''}"`;
    }

    /**
     * Get conversation age in minutes
     */
    getConversationAge(history) {
        if (!history || history.length === 0) return 0;

        const firstMsg = history[0];
        const timestamp = firstMsg.timestamp || firstMsg.createdAt;
        if (!timestamp) return 0;

        return Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000); // minutes
    }

    /**
     * Generate cache key for entities
     */
    getCacheKey(messages) {
        // Use hash of last 5 messages content
        const content = messages.slice(-5).map(m => m.content || m.text).join('|');
        return content.slice(0, 100); // Simple key, can be improved with actual hash
    }

    /**
     * Default entities structure
     */
    getDefaultEntities() {
        return {
            current_product: null,
            all_products: [],
            user_measurements: {},
            preferences: {},
            topic: 'general',
            intent_history: []
        };
    }

    /**
     * Clear entity cache
     */
    clearCache() {
        this.entityCache.clear();
        console.log('🧹 Entity cache cleared');
    }

    /**
     * Get cache stats (for monitoring)
     */
    getCacheStats() {
        return {
            size: this.entityCache.size,
            ttl_minutes: this.cacheTTL / 60000
        };
    }
}

// Export singleton instance
export const enhancedContextManager = new EnhancedContextManager();
