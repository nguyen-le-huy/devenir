import { ChatIntent } from '../types';

/**
 * Detect intent from user message using regex patterns
 * @param message User message string
 * @returns ChatIntent
 */
export const detectIntent = (message: string): ChatIntent => {
    const lowerMsg = message.toLowerCase();

    // Size-related keywords
    if (lowerMsg.match(/size|kích thước|mặc thử|vừa|lớn|nhỏ/)) {
        return 'size-help';
    }

    // Product recommendation keywords
    if (lowerMsg.match(/gợi ý|đề xuất|tìm|muốn mua|cần|nên|phù hợp/)) {
        return 'product-recommendation';
    }

    // Styling advice keywords
    if (lowerMsg.match(/phối|đồ|mix|match|styling|style|phong cách/)) {
        return 'styling-advice';
    }

    // Order/shipping keywords
    if (lowerMsg.match(/đơn hàng|giao hàng|ship|vận chuyển|order/)) {
        return 'order-inquiry';
    }

    // Consultation keywords
    if (lowerMsg.match(/tư vấn|hỏi|giúp|hướng dẫn|không biết/)) {
        return 'consultation';
    }

    return 'general';
};

/**
 * Check if the user is asking strictly about orders/tracking
 * Can be used to conditionally show Order tracking UI components in the future
 */
export const isOrderIntent = (intent: ChatIntent): boolean => {
    return intent === 'order-inquiry';
};
