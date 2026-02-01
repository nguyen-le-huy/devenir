import ChatLog from '../../../models/ChatLogModel.js';

export class ConversationManager {
    /**
     * Get conversation context for user
     * @param {string} userId - User ID (or session ID for guests)
     * @param {Array} recentMessages - Recent messages from client (fallback)
     */
    async getContext(userId, recentMessages = []) {
        try {
            // Get today's active session or latest session
            // Note: For guests, userId might be a session string, but ChatLog expects ObjectId for userId.
            // If userId is not ObjectId, we treat it as sessionId.

            const query = this._buildQuery(userId);

            const session = await ChatLog.findOne(query)
                .sort({ createdAt: -1 }) // Get latest session
                .lean();

            let history = [];
            if (session && session.messages) {
                // Get last 50 messages
                history = session.messages.slice(-50);
            }

            // Extract recent product ID from recent messages (client side) OR server history
            let recentProductId = null;

            // Combine sources for product search: Client messages + DB History
            // We prioritize recent client messages as they are "fresher" in user's mind
            const searchPool = [...(recentMessages || []), ...history].reverse(); // Newest first

            for (const msg of searchPool) {
                // Check metadata/suggestedProducts
                const products = msg.metadata?.suggested_products || msg.suggestedProducts;
                if (products && products.length > 0) {
                    // Handle both object structure (DB) and client structure
                    recentProductId = products[0]._id || products[0].id;
                    if (recentProductId) break;
                }
            }

            console.log(`🔍 Extracted recentProductId: ${recentProductId}`);

            return {
                conversation_id: session?.sessionId || userId,
                history: history,
                recent_messages: recentMessages,
                recent_product_id: recentProductId
            };
        } catch (error) {
            console.error('Get Context Error:', error);
            return {
                conversation_id: userId,
                history: [],
                recent_messages: recentMessages,
                recent_product_id: null
            };
        }
    }

    /**
     * Add message to conversation history
     * @param {string} userId - User ID
     * @param {Object} message - Message object
     */
    async addMessage(userId, message) {
        try {
            const query = this._buildQuery(userId);

            // Find active session or create new one
            // We define "Active Session" as one created within last 24 hours? 
            // Or just append to latest session for simplicity?
            // For now: Always append to the latest session for this user. 
            // If no session exists, create one.

            let session = await ChatLog.findOne(query).sort({ createdAt: -1 });

            if (!session) {
                // Create new session
                session = await ChatLog.create({
                    userId: this._isObjectId(userId) ? userId : null,
                    sessionId: userId, // Use userId as sessionId for now if string
                    messages: []
                });
            }

            // Format message for DB
            const dbMessage = {
                role: message.role,
                content: message.content,
                timestamp: message.timestamp || new Date(),
                metadata: {
                    intent: message.intent,
                    suggested_products: message.metadata?.suggested_products,
                    ...message.metadata
                }
            };

            await ChatLog.findByIdAndUpdate(
                session._id,
                {
                    $push: { messages: dbMessage },
                    $set: {
                        'analytics.intent': message.intent,
                        'analytics.timestamp': new Date()
                    }
                }
            );

            return session;
        } catch (error) {
            console.error('Add Message Error:', error);
            return null;
        }
    }

    /**
     * Get conversation history
     */
    async getHistory(userId, limit = 50) {
        try {
            const query = this._buildQuery(userId);
            const session = await ChatLog.findOne(query).sort({ createdAt: -1 }).lean();

            if (!session || !session.messages) return [];

            return session.messages.slice(-limit);
        } catch (error) {
            console.error('Get History Error:', error);
            return [];
        }
    }

    /**
     * Clear context
     */
    async clearContext(userId) {
        try {
            const query = this._buildQuery(userId);
            await ChatLog.deleteMany(query);
            return { cleared: true };
        } catch (error) {
            console.error('Clear Context Error:', error);
            return { cleared: false, error: error.message };
        }
    }

    // --- Helpers ---

    _isObjectId(id) {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    _buildQuery(userId) {
        if (this._isObjectId(userId)) {
            return { userId: userId };
        } else {
            return { sessionId: userId };
        }
    }
}
