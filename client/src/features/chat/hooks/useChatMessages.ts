/**
 * Chat Messages Hook
 * Manages chat messages with React Query and local state
 * Handles sending, receiving, and persisting messages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatSession } from './useChatSession';
import { useChatHistory, useSendMessage } from './useChatQuery';
import type {
    ChatMessage,
    ChatMessagePayload,
    ChatHistoryMessage,
} from '../types';
import {
    CHAT_STORAGE_KEY,
    MAX_CONVERSATION_HISTORY,
    CHAT_ERRORS,
} from '../utils/chatConstants';
import { validateMessage, sanitizeInput } from '../utils/chatValidation';
import { detectIntent } from '../utils/chatUtils';
import { trackEvent } from '@/shared/utils/eventTracker';

interface UseChatMessagesReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (text: string) => Promise<void>;
    addBotMessage: (text: string) => void;
    clearMessages: () => void;
    markMessageAsStreamed: (id: number | string) => void;
}

/**
 * Hook for managing chat messages
 * Handles sending, receiving, and persisting messages
 */
export const useChatMessages = (): UseChatMessagesReturn => {
    const { sessionId, isAuthenticated, setSessionId } = useChatSession();

    // React Query Hooks
    const { data: serverHistory, isLoading: isHistoryLoading } = useChatHistory(isAuthenticated);
    const sendMessageMutation = useSendMessage();

    // Local State (for Guests & Optimistic Updates)
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((msg: ChatMessage) => ({
                    ...msg,
                    isStreamed: true,
                    timestamp: new Date(msg.timestamp),
                }));
            }
            return [];
        } catch (error) {
            console.error('Failed to load chat messages:', error);
            return [];
        }
    });

    const [error, setError] = useState<string | null>(null);
    const historyLoadedRef = useRef(false);

    // Sync Server History (Only once when loaded)
    useEffect(() => {
        if (isAuthenticated && serverHistory && !historyLoadedRef.current) {
            if (serverHistory.length > 0) {
                setMessages(serverHistory);
            }
            historyLoadedRef.current = true;
        }
    }, [isAuthenticated, serverHistory]);

    // Persist messages to sessionStorage (Guest only or backup)
    useEffect(() => {
        if (messages.length > 0) {
            try {
                sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Failed to save chat messages:', error);
            }
        }
    }, [messages]);

    /**
     * Send a message to the chat API
     */
    const sendMessage = useCallback(async (text: string) => {
        // Validate and sanitize input
        const sanitized = sanitizeInput(text);
        const validation = validateMessage(sanitized);

        if (!validation.valid) {
            setError(validation.error || CHAT_ERRORS.EMPTY_MESSAGE);
            return;
        }

        setError(null);

        // Track chat start
        if (messages.length === 0) {
            trackEvent.chatStart();
        }

        // Create user message
        const userMessage: ChatMessage = {
            id: Date.now(),
            text: sanitized,
            sender: 'user',
            timestamp: new Date(),
        };

        // Optimistic update
        setMessages((prev) => [...prev, userMessage]);

        try {
            // Prepare conversation history
            const conversationHistory: ChatHistoryMessage[] = messages
                .slice(-MAX_CONVERSATION_HISTORY)
                .map((msg) => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text,
                    suggestedProducts: msg.suggestedProducts || [],
                }));

            // Prepare payload
            const payload: ChatMessagePayload = {
                message: sanitized,
                conversation_history: conversationHistory,
            };

            if (!isAuthenticated && sessionId) {
                payload.session_id = sessionId;
            }

            // Call Mutation
            const response = await sendMessageMutation.mutateAsync({
                payload,
                isAuthenticated
            });

            // Handle Session (Guest)
            if (!isAuthenticated && response.session_id) {
                setSessionId(response.session_id);
            }

            // Track event
            trackEvent.chatMessage({
                message: sanitized,
                intent: response.intent || detectIntent(sanitized),
                hasProducts: (response.suggested_products?.length || 0) > 0,
                hasAction: !!response.suggested_action,
            });

            // Add bot message
            const botMessage: ChatMessage = {
                id: Date.now() + 1,
                text: response.answer || 'Xin lỗi, tôi không thể trả lời lúc này.',
                sender: 'bot',
                timestamp: new Date(),
                suggestedProducts: response.suggested_products || [],
                suggestedAction: response.suggested_action,
                storeLocation: response.store_location,
                isStreamed: false,
            };

            setMessages((prev) => [...prev, botMessage]);

        } catch (err) {
            console.error('Chat Error:', err);

            // Set error state
            setError(err instanceof Error ? err.message : CHAT_ERRORS.NETWORK_ERROR);

            // Add error message
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                text: CHAT_ERRORS.NETWORK_ERROR,
                sender: 'bot',
                timestamp: new Date(),
                isStreamed: true,
            };

            setMessages((prev) => [...prev, errorMessage]);
        }
    }, [messages, isAuthenticated, sessionId, setSessionId, sendMessageMutation]);

    /**
     * Add a bot message (for action feedback)
     */
    const addBotMessage = useCallback((text: string) => {
        const botMessage: ChatMessage = {
            id: `feedback-${Date.now()}`,
            text,
            sender: 'bot',
            timestamp: new Date(),
            isStreamed: false,
        };
        setMessages((prev) => [...prev, botMessage]);
    }, []);

    /**
     * Clear all messages
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
        sessionStorage.removeItem(CHAT_STORAGE_KEY);
        setError(null);
        historyLoadedRef.current = false;
    }, []);

    /**
     * Mark a message as streamed
     */
    const markMessageAsStreamed = useCallback((id: number | string) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === id ? { ...msg, isStreamed: true } : msg
            )
        );
    }, []);

    // Derived Loading State
    const isLoading = sendMessageMutation.isPending || (isAuthenticated && isHistoryLoading);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        addBotMessage,
        clearMessages,
        markMessageAsStreamed,
    };
};
