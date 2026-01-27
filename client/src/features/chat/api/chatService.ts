import apiClient from '@/core/api/apiClient';
import { ChatPayload, ChatResponse, ChatMessage, ChatHistoryMessage } from '../types';

// Session ID for guest users
// Note: In a real app setup, this might be better managed in a Context or Store, 
// but for a stateless service module, we rely on localStorage persistence.
let guestSessionId = localStorage.getItem('chat_session_id') || null;

/**
 * Send message to RAG chat API
 * @param message - User message
 * @param conversationHistory - Previous messages
 * @param isAuthenticated - Is user logged in
 */
export const sendChatMessage = async (
    message: string,
    conversationHistory: ChatMessage[] = [],
    isAuthenticated: boolean = false
): Promise<ChatResponse> => {
    const endpoint = isAuthenticated ? '/chat' : '/chat/guest';

    const historyPayload: ChatHistoryMessage[] = conversationHistory
        .slice(-50)
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
            // Include suggested products for context if they exist
            suggestedProducts: msg.suggestedProducts || []
        }));

    const payload: ChatPayload = {
        message,
        conversation_history: historyPayload
    };

    // Add session_id for guest users
    if (!isAuthenticated && guestSessionId) {
        payload.session_id = guestSessionId;
    }

    // We use 'unknown' first to safely cast, as apiClient response type isn't generic enough yet
    const response = await apiClient.post(endpoint, payload) as unknown as ChatResponse;

    // apiClient interceptor usually returns response.data. 
    // If the API wrapper returns the full Axios response, we might need adjustments.
    // Assuming apiClient returns the data object directly based on typical project setups.

    // Save session_id for guest users
    if (!isAuthenticated && response?.session_id) {
        guestSessionId = response.session_id;
        localStorage.setItem('chat_session_id', response.session_id);
    }

    return response;
};

/**
 * Get chat history (requires auth)
 * @param limit - Number of messages to fetch
 */
export const getChatHistory = async (limit: number = 20): Promise<any> => {
    return apiClient.get(`/chat/history?limit=${limit}`);
};

/**
 * Clear chat history (requires auth)
 */
export const clearChatHistory = async (): Promise<any> => {
    return apiClient.delete('/chat/clear');
};

/**
 * Check RAG service health
 */
export const checkChatHealth = async (): Promise<any> => {
    return apiClient.get('/chat/health');
};

/**
 * Clear guest session
 */
export const clearGuestSession = (): void => {
    guestSessionId = null;
    localStorage.removeItem('chat_session_id');
};
