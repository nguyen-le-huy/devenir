export type ChatSender = 'user' | 'bot';
export type ActionType = 'yes' | 'no';
export type ActionResult = 'added' | 'dismissed' | 'error';
export type ChatIntent = 'size-help' | 'product-recommendation' | 'styling-advice' | 'order-inquiry' | 'consultation' | 'general';

export interface SuggestedProduct {
    _id: string;
    variantId?: string;
    name: string;
    minPrice: number;
    maxPrice: number;
    mainImage: string;
    inStock: boolean;
}

export interface StoreLocation {
    address: string;
    googleMapsEmbedUrl: string;
    directionsUrl: string;
}

export interface SuggestedAction {
    type: string;
    prompt: string;
    variant_id?: string;
    product?: {
        name: string;
        id: string;
    };
}

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

export interface ChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    suggestedProducts?: SuggestedProduct[];
}

export interface ChatPayload {
    message: string;
    conversation_history: ChatHistoryMessage[];
    session_id?: string;
}

export interface ChatResponse {
    answer: string;
    intent?: ChatIntent;
    suggested_products?: SuggestedProduct[];
    suggested_action?: SuggestedAction;
    store_location?: StoreLocation;
    session_id?: string;
    data?: ChatResponse; // Handle nested data structure from some API wrappers
}
