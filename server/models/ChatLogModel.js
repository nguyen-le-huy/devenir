import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema(
    {
        user_id: {
            type: String,
            required: true,
            index: true
        },
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        intent: {
            type: String,
            enum: ['product_advice', 'size_recommendation', 'style_matching', 'order_lookup', 'return_exchange', 'general']
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        created_at: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: false
    }
);

// Index for efficient queries
chatLogSchema.index({ user_id: 1, created_at: -1 });

const ChatLog = mongoose.model('ChatLog', chatLogSchema);

export default ChatLog;
