/**
 * React Query Hooks for Chat Feature
 * Handles server state management for chat history and messaging
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import { chatKeys } from '../api/chatKeys';
import type { ChatMessage, ChatHistoryMessage, ChatMessagePayload } from '../types';

// Map History to UI
const mapHistoryToUI = (historyMessages: ChatHistoryMessage[]): ChatMessage[] => {
    return historyMessages.map((msg, index) => ({
        id: `history-${index}-${Date.now()}`,
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'bot',
        timestamp: new Date(), // API limitation: history doesn't hav timestamps yet
        suggestedProducts: msg.suggestedProducts,
        isStreamed: true,
    }));
};

export const useChatHistory = (isAuthenticated: boolean) => {
    return useQuery({
        queryKey: chatKeys.history(),
        queryFn: () => chatApi.getHistory(),
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 min
        select: (data) => mapHistoryToUI(data.messages),
    });
};

export const useSendMessage = () => {
    return useMutation({
        mutationFn: (args: { payload: ChatMessagePayload; isAuthenticated: boolean }) =>
            chatApi.sendMessage(args.payload, args.isAuthenticated),
    });
};

export const useClearChat = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: chatApi.clearHistory,
        onSuccess: () => {
            // Update cache to empty state
            queryClient.setQueryData(chatKeys.history(), { messages: [], total: 0 });
            queryClient.invalidateQueries({ queryKey: chatKeys.history() });
        },
    });
};
