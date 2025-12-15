import apiClient from './api';

// Session ID cho guest users
let guestSessionId = localStorage.getItem('chat_session_id') || null;

/**
 * Send message to RAG chat API
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous messages
 * @param {boolean} isAuthenticated - Is user logged in
 */
export const sendChatMessage = async (message, conversationHistory = [], isAuthenticated = false) => {
    const endpoint = isAuthenticated ? '/chat' : '/chat/guest';

    const payload = {
        message,
        conversation_history: conversationHistory.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
            // Include suggested products for context
            suggestedProducts: msg.suggestedProducts || []
        }))
    };

    // Add session_id for guest users
    if (!isAuthenticated && guestSessionId) {
        payload.session_id = guestSessionId;
    }

    const response = await apiClient.post(endpoint, payload);

    // Save session_id for guest users
    if (!isAuthenticated && response.session_id) {
        guestSessionId = response.session_id;
        localStorage.setItem('chat_session_id', response.session_id);
    }

    return response;
};

/**
 * Get chat history (requires auth)
 * @param {number} limit - Number of messages to fetch
 */
export const getChatHistory = async (limit = 20) => {
    return apiClient.get(`/chat/history?limit=${limit}`);
};

/**
 * Clear chat history (requires auth)
 */
export const clearChatHistory = async () => {
    return apiClient.delete('/chat/clear');
};

/**
 * Check RAG service health
 */
export const checkChatHealth = async () => {
    return apiClient.get('/chat/health');
};

/**
 * Clear guest session
 */
export const clearGuestSession = () => {
    guestSessionId = null;
    localStorage.removeItem('chat_session_id');
};
