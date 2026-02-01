/**
 * Main Chat Hook
 * Composition of smaller hooks for chat functionality
 * Refactored to follow clean architecture and TypeScript strict mode
 */

import { useState, useCallback } from 'react';
import { useAuthStore, type User } from '@/core/stores/useAuthStore';
import { useChatMessages } from './useChatMessages';
import { useChatActions } from './useChatActions';
import type { ChatMessage, ActionType, ActionResult, SuggestedAction } from '../types';

interface UseChatReturn {
    messages: ChatMessage[];
    isTyping: boolean;
    showInitialView: boolean;
    isAuthenticated: boolean;
    user: User | null;
    error: string | null;
    sendMessage: (text: string) => Promise<void>;
    handleAction: (
        messageId: number | string,
        action: ActionType,
        actionData?: SuggestedAction
    ) => void;
    markMessageAsStreamed: (id: number | string) => void;
    clearHistory: () => void;
}

/**
 * Main hook for chat functionality
 * Composes smaller hooks for better separation of concerns
 */
export const useChat = (): UseChatReturn => {
    // Auth state with atomic selectors (no any types!)
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Chat messages management
    const {
        messages,
        isLoading,
        error,
        sendMessage: sendMessageToApi,
        addBotMessage,
        clearMessages,
        markMessageAsStreamed,
    } = useChatMessages();

    // Local state for action states only (not messages)
    const [messageActions, setMessageActions] = useState<
        Record<string | number, { handled: boolean; result: ActionResult }>
    >({});

    // Apply action states to messages
    const messagesWithActions = messages.map((msg) => {
        const actionState = messageActions[msg.id];
        if (actionState) {
            return {
                ...msg,
                actionHandled: actionState.handled,
                actionResult: actionState.result,
            };
        }
        return msg;
    });

    // Show initial view if no messages
    const showInitialView = messagesWithActions.length === 0;

    /**
     * Update message action state
     */
    const updateMessageAction = useCallback(
        (id: number | string, result: ActionResult) => {
            setMessageActions((prev) => ({
                ...prev,
                [id]: { handled: true, result },
            }));
        },
        []
    );

    // Chat actions (Yes/No buttons)
    // addBotMessage is now stable from useChatMessages
    const { handleAction: handleActionInternal } = useChatActions({
        onActionHandled: updateMessageAction,
        onBotMessage: addBotMessage,
    });

    /**
     * Wrapper for sendMessage with error handling
     */
    const sendMessage = useCallback(
        async (text: string) => {
            try {
                await sendMessageToApi(text);
            } catch (err) {
                // Error already handled in useChatMessages
                console.error('Send message error:', err);
            }
        },
        [sendMessageToApi]
    );

    /**
     * Clear chat history
     */
    const clearHistory = useCallback(() => {
        clearMessages();
        setMessageActions({});
    }, [clearMessages]);

    return {
        messages: messagesWithActions,
        isTyping: isLoading,
        showInitialView,
        isAuthenticated,
        user,
        error,
        sendMessage,
        handleAction: handleActionInternal,
        markMessageAsStreamed,
        clearHistory,
    };
};
