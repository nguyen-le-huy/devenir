/**
 * API-specific types for Chat feature
 * Defines request/response structures for chat endpoints
 */

import type { SuggestedProduct, SuggestedAction, StoreLocation, ChatIntent } from './index';

/**
 * Request payload for sending a chat message
 */
export interface ChatMessagePayload {
    message: string;
    conversation_history: ChatHistoryMessage[];
    session_id?: string;
}

/**
 * Response from chat API
 */
export interface ChatApiResponse {
    answer: string;
    intent?: ChatIntent;
    suggested_products?: SuggestedProduct[];
    suggested_action?: SuggestedAction;
    store_location?: StoreLocation;
    session_id?: string;
}

/**
 * Chat history message format for API
 */
export interface ChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    suggestedProducts?: SuggestedProduct[];
}

/**
 * Chat history response
 */
export interface ChatHistoryResponse {
    messages: ChatHistoryMessage[];
    total: number;
}

/**
 * Health check response
 */
export interface ChatHealthResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    service: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

/**
 * API Error response
 */
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    data?: unknown;
}
