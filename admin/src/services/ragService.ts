import axiosInstance from './axiosConfig'

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export const ragService = {
    /**
     * Send a message to the RAG chatbot
     */
    sendMessage: async (message: string, history: ChatMessage[] = []) => {
        // Transform history to match backend expectation if needed, 
        // but the backend mostly just needs role/content
        const cleanedHistory = history.map(h => ({
            role: h.role,
            content: h.content
        }));

        const response = await axiosInstance.post('/chat', {
            message,
            conversation_history: cleanedHistory
        });
        return response.data;
    },

    /**
     * Get chat history
     */
    getHistory: async (limit: number = 50) => {
        const response = await axiosInstance.get(`/chat/history?limit=${limit}`);
        return response.data;
    },

    /**
     * Clear conversation history
     */
    clearHistory: async () => {
        const response = await axiosInstance.delete('/chat/clear');
        return response.data;
    }
}
