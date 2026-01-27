import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { sendChatMessage } from '../api/chatService';
import { ChatMessage, ActionResult } from '../types';
import { detectIntent } from '../utils/chatUtils';
import { useAddToCart } from '@/features/cart/hooks/useCart';
import { trackEvent } from '@/shared/utils/eventTracker';

const CHAT_STORAGE_KEY = 'devenir_chat_session';

export const useChat = () => {
    // Global State
    const user = useAuthStore((state: any) => state.user);
    const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);

    // Local State
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
            if (saved) {
                // Mark all loaded messages as already streamed to avoid re-streaming
                return JSON.parse(saved).map((msg: ChatMessage) => ({ ...msg, isStreamed: true }));
            }
            return [];
        } catch {
            return [];
        }
    });

    const [isTyping, setIsTyping] = useState(false);

    // Show initial view if no messages
    const showInitialView = messages.length === 0;

    // Cart Mutation
    const addToCartMutation = useAddToCart();

    // Persist messages
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    /**
     * Send a message to the bot
     */
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // Track chat start
        if (messages.length === 0) {
            trackEvent.chatStart();
        }

        const userMessage: ChatMessage = {
            id: Date.now(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            const response = await sendChatMessage(
                text,
                [...messages, userMessage],
                isAuthenticated
            );

            // Handle nested data legacy structure if present
            const chatData = response.data || response;

            // Track event
            trackEvent.chatMessage({
                message: text,
                intent: chatData.intent || detectIntent(text),
                hasProducts: (chatData.suggested_products?.length || 0) > 0,
                hasAction: !!chatData.suggested_action
            });

            const botMessage: ChatMessage = {
                id: Date.now() + 1,
                text: chatData.answer || "Xin lỗi, tôi không thể trả lời lúc này.",
                sender: 'bot',
                timestamp: new Date(),
                suggestedProducts: chatData.suggested_products || [],
                suggestedAction: chatData.suggested_action,
                storeLocation: chatData.store_location,
                isStreamed: false
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error('Chat Error:', err);
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
                sender: 'bot',
                timestamp: new Date(),
                isStreamed: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    }, [messages, isAuthenticated]);

    /**
     * Handle actions (Yes/No buttons)
     */
    const handleAction = useCallback((messageId: number | string, action: 'yes' | 'no', actionData?: any) => {
        if (action === 'yes' && actionData?.variant_id) {
            addToCartMutation.mutate(
                { variantId: actionData.variant_id, quantity: 1 },
                {
                    onSuccess: () => {
                        updateMessageAction(messageId, 'added');
                        addBotMessage(`Đã thêm **${actionData.product?.name || 'sản phẩm'}** vào giỏ hàng!`);
                    },
                    onError: (error: any) => {
                        console.error('Add to cart error:', error);
                        updateMessageAction(messageId, 'error');
                    }
                }
            );
        } else if (action === 'no') {
            updateMessageAction(messageId, 'dismissed');
            addBotMessage('Không sao! Bạn cần tôi hỗ trợ gì thêm không?');
        }
    }, [addToCartMutation]);

    // Helpers
    const updateMessageAction = (id: number | string, result: ActionResult) => {
        setMessages(prev => prev.map(msg =>
            msg.id === id ? { ...msg, actionHandled: true, actionResult: result } : msg
        ));
    };

    const addBotMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text,
            sender: 'bot',
            timestamp: new Date(),
            isStreamed: false // Or true if we don't want to stream system confirmations
        }]);
    };

    const markMessageAsStreamed = useCallback((id: number | string) => {
        setMessages(prev => prev.map(msg =>
            msg.id === id ? { ...msg, isStreamed: true } : msg
        ));
    }, []);

    const clearHistory = useCallback(() => {
        setMessages([]);
        sessionStorage.removeItem(CHAT_STORAGE_KEY);
    }, []);

    return {
        messages,
        isTyping,
        showInitialView,
        isAuthenticated,
        user,
        sendMessage,
        handleAction,
        markMessageAsStreamed,
        clearHistory
    };
};
