/**
 * Domain types for Chat feature
 * Core business logic types used across the feature
 */

// Type Aliases
export type ChatSender = 'user' | 'bot';
export type ActionType = 'yes' | 'no';
export type ActionResult = 'added' | 'dismissed' | 'error';
export type ChatIntent =
    | 'size-help'
    | 'product-recommendation'
    | 'styling-advice'
    | 'order-inquiry'
    | 'consultation'
    | 'general';

/**
 * Suggested product from chat response
 */
export interface SuggestedProduct {
    _id: string;
    variantId?: string;
    name: string;
    minPrice: number;
    maxPrice: number;
    mainImage: string;
    inStock: boolean;
}

/**
 * Store location information
 */
export interface StoreLocation {
    address: string;
    googleMapsEmbedUrl: string;
    directionsUrl: string;
}

/**
 * Suggested action (e.g., add to cart)
 */
export interface SuggestedAction {
    type: string;
    prompt: string;
    variant_id?: string;
    product?: {
        name: string;
        id: string;
    };
}

/**
 * Chat message (UI representation)
 */
export interface ChatMessage {
    id: number | string;
    text: string;
    sender: ChatSender;
    timestamp: Date | string;

    // Bot specific fields
    suggestedProducts?: SuggestedProduct[];
    suggestedAction?: SuggestedAction;
    storeLocation?: StoreLocation;

    // UI state
    isStreamed?: boolean;
    actionHandled?: boolean;
    actionResult?: ActionResult;
}

// Re-export API types for convenience
export type {
    ChatMessagePayload,
    ChatApiResponse,
    ChatHistoryMessage,
    ChatHistoryResponse,
    ChatHealthResponse,
    ApiResponse,
    ApiError,
} from './api.types';

// Re-export store types
export type {
    ChatUIState,
    ChatSessionState,
} from './store.types';
