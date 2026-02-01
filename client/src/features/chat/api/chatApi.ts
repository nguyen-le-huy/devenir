/**
 * Chat API Client
 * Pure API functions without side effects
 * All state management handled by React Query
 */

import apiClient from '@/core/api/apiClient';
import type {
    ChatMessagePayload,
    ChatApiResponse,
    ChatHistoryResponse,
    ChatHealthResponse,
} from '../types/api.types';

/**
 * Send message to RAG chat API
 * @param payload - Chat message payload
 * @param isAuthenticated - Whether user is authenticated
 * @returns Chat response
 */
export const sendChatMessage = async (
    payload: ChatMessagePayload,
    isAuthenticated: boolean
): Promise<ChatApiResponse> => {
    const endpoint = isAuthenticated ? '/chat' : '/chat/guest';

    try {
        // apiClient interceptor returns response.data directly
        const response = await apiClient.post(endpoint, payload);

        // Handle both direct response and nested data structure
        const data = (response as any).data || response;

        return data as ChatApiResponse;
    } catch (error) {
        // Re-throw with better error message
        throw new Error(
            error instanceof Error ? error.message : 'Failed to send chat message'
        );
    }
};

/**
 * Get chat history (requires authentication)
 * @param limit - Number of messages to fetch
 * @returns Chat history
 */
export const getChatHistory = async (
    limit: number = 20
): Promise<ChatHistoryResponse> => {
    try {
        // apiClient returns data directly via interceptor
        const response = await apiClient.get(`/chat/history?limit=${limit}`);
        return response as unknown as ChatHistoryResponse;
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Failed to fetch chat history'
        );
    }
};

/**
 * Clear chat history (requires authentication)
 * @returns Success response
 */
export const clearChatHistory = async (): Promise<{ success: boolean }> => {
    try {
        const response = await apiClient.delete('/chat/clear');
        return response as unknown as { success: boolean };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Failed to clear chat history'
        );
    }
};

/**
 * Check RAG service health
 * @returns Health status
 */
export const checkChatHealth = async (): Promise<ChatHealthResponse> => {
    try {
        const response = await apiClient.get('/chat/health');
        return response as unknown as ChatHealthResponse;
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Failed to check chat health'
        );
    }
};

// Export all API functions
export const chatApi = {
    sendMessage: sendChatMessage,
    getHistory: getChatHistory,
    clearHistory: clearChatHistory,
    checkHealth: checkChatHealth,
} as const;
