import ChatLog from '../../../models/ChatLogModel.js';

export class ConversationManager {
    /**
     * Get conversation context for user
     * @param {string} userId - User ID
     * @param {Array} recentMessages - Recent messages from client
     */
    async getContext(userId, recentMessages = []) {
        try {
            // Get recent chat history from DB
            const history = await ChatLog.find({ user_id: userId })
                .sort({ created_at: -1 })
                .limit(10)
                .lean();

            // Extract recent product ID from recent messages (client side)
            let recentProductId = null;

            // Look backwards through messages
            for (let i = recentMessages.length - 1; i >= 0; i--) {
                const msg = recentMessages[i];
                // Check if bot message has suggested products
                if ((msg.role === 'assistant' || msg.sender === 'bot') &&
                    msg.suggestedProducts &&
                    msg.suggestedProducts.length > 0) {
                    recentProductId = msg.suggestedProducts[0]._id || msg.suggestedProducts[0].id;
                    break;
                }

                // Also check DB history if not found in client messages
                if (!recentProductId && history.length > 0) {
                    const lastProductLog = history.find(log =>
                        log.metadata?.suggested_products?.length > 0
                    );
                    if (lastProductLog) {
                        recentProductId = lastProductLog.metadata.suggested_products[0]._id;
                    }
                }
            }

            console.log(`🔍 Extracted recentProductId: ${recentProductId}`);
            if (recentMessages.length > 0) {
                const lastMsg = recentMessages[recentMessages.length - 1];
                console.log(`📨 Last client message: ${lastMsg.content.substring(0, 50)}...`);
                console.log(`📦 Messages with products: ${recentMessages.filter(m => m.suggestedProducts?.length > 0).length}`);
            }

            return {
                conversation_id: userId,
                history: history.reverse(), // Oldest first
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
            const chatLog = await ChatLog.create({
                user_id: userId,
                role: message.role,
                content: message.content,
                intent: message.intent,
                metadata: message.metadata,
                created_at: message.timestamp || new Date()
            });

            return chatLog;
        } catch (error) {
            console.error('Add Message Error:', error);
            return null;
        }
    }

    /**
     * Get conversation history for a user
     * @param {string} userId - User ID
     * @param {number} limit - Max messages to return
     */
    async getHistory(userId, limit = 20) {
        try {
            return await ChatLog.find({ user_id: userId })
                .sort({ created_at: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            console.error('Get History Error:', error);
            return [];
        }
    }

    /**
     * Clear conversation context for a user
     * @param {string} userId - User ID
     */
    async clearContext(userId) {
        try {
            await ChatLog.deleteMany({ user_id: userId });
            return { cleared: true };
        } catch (error) {
            console.error('Clear Context Error:', error);
            return { cleared: false, error: error.message };
        }
    }

    /**
     * Get last product discussed in conversation
     * @param {string} userId - User ID
     */
    async getLastProductContext(userId) {
        try {
            const recentLogs = await ChatLog.find({
                user_id: userId,
                'metadata.suggested_products': { $exists: true }
            })
                .sort({ created_at: -1 })
                .limit(1)
                .lean();

            if (recentLogs.length > 0 && recentLogs[0].metadata?.suggested_products) {
                return recentLogs[0].metadata.suggested_products[0];
            }

            return null;
        } catch (error) {
            console.error('Get Last Product Context Error:', error);
            return null;
        }
    }

    /**
     * Get conversation summary for context window
     * @param {string} userId - User ID
     */
    async getConversationSummary(userId) {
        try {
            const history = await this.getHistory(userId, 5);

            if (history.length === 0) {
                return null;
            }

            // Build summary of recent conversation
            const summary = history.reverse().map(msg =>
                `${msg.role === 'user' ? 'Khách' : 'Bot'}: ${msg.content.substring(0, 100)}...`
            ).join('\n');

            return summary;
        } catch (error) {
            console.error('Get Conversation Summary Error:', error);
            return null;
        }
    }
}
