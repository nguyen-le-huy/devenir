import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            sparse: true // Allow null for guest users
        },
        sessionId: {
            type: String,
            required: true,
            index: true
        },
        messages: {
            type: [{
                role: {
                    type: String,
                    enum: ['user', 'assistant', 'system'],
                    required: true
                },
                content: {
                    type: String,
                    required: true
                },
                metadata: {
                    type: mongoose.Schema.Types.Mixed,
                    default: {}
                },
                timestamp: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: []
        },
        analytics: {
            intent: String,
            hasPersonalization: Boolean,
            customerType: String,
            engagementScore: Number,
            responseTime: Number,
            messageLength: Number,
            productsShown: Number,
            userSatisfaction: Number,
            timestamp: Date,
            // RAG 3.0 Quality Metrics
            qualityMetrics: {
                ragasScore: Number,          // Overall quality score (0-1)
                faithfulness: Number,        // Fact accuracy (0-1)
                relevance: Number,           // Answer relevance (0-1)
                userFeedback: {
                    type: String,
                    enum: ['thumbs_up', 'thumbs_down', 'edited', null],
                    default: null
                },
                wasEdited: {
                    type: Boolean,
                    default: false
                }
            },
            // RAG 3.0 Retrieval Details
            retrievalDetails: {
                productsRetrieved: Number,   // Number of products retrieved
                topRelevanceScore: Number,   // Highest relevance score
                rerankingTime: Number,       // Reranking latency (ms)
                cacheHit: {
                    type: Boolean,
                    default: false
                },
                personalizedBoost: Boolean   // Was personalization applied
            },
            requestId: String                // For feedback correlation
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes for efficient queries
chatLogSchema.index({ userId: 1, createdAt: -1 });
chatLogSchema.index({ sessionId: 1 });
chatLogSchema.index({ 'analytics.customerType': 1 });
chatLogSchema.index({ 'analytics.intent': 1 });
chatLogSchema.index({ createdAt: -1 });

const ChatLog = mongoose.model('ChatLog', chatLogSchema);

export default ChatLog;
