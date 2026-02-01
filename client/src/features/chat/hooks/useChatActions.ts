/**
 * Chat Actions Hook
 * Handles action buttons (Yes/No for add to cart, etc.)
 */

import { useCallback } from 'react';
import { useAddToCart } from '@/features/cart/hooks/useCart';
import type { ActionType, ActionResult, SuggestedAction } from '../types';
import { CHAT_SUCCESS } from '../utils/chatConstants';

interface UseChatActionsProps {
    onActionHandled: (messageId: number | string, result: ActionResult) => void;
    onBotMessage: (text: string) => void;
}

interface UseChatActionsReturn {
    handleAction: (
        messageId: number | string,
        action: ActionType,
        actionData?: SuggestedAction
    ) => void;
    isProcessing: boolean;
}

/**
 * Hook for handling chat action buttons
 * Manages add to cart and other suggested actions
 */
export const useChatActions = ({
    onActionHandled,
    onBotMessage,
}: UseChatActionsProps): UseChatActionsReturn => {
    const addToCartMutation = useAddToCart();

    /**
     * Handle action button click (Yes/No)
     */
    const handleAction = useCallback(
        (
            messageId: number | string,
            action: ActionType,
            actionData?: SuggestedAction
        ) => {
            if (action === 'yes' && actionData?.variant_id) {
                // Add to cart
                addToCartMutation.mutate(
                    { variantId: actionData.variant_id, quantity: 1 },
                    {
                        onSuccess: () => {
                            onActionHandled(messageId, 'added');
                            const productName = actionData.product?.name || 'sản phẩm';
                            onBotMessage(`${CHAT_SUCCESS.ADDED_TO_CART} **${productName}**`);
                        },
                        onError: (error) => {
                            console.error('Add to cart error:', error);
                            onActionHandled(messageId, 'error');
                            onBotMessage('Xin lỗi, không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.');
                        },
                    }
                );
            } else if (action === 'no') {
                // User declined
                onActionHandled(messageId, 'dismissed');
                onBotMessage('Không sao! Bạn cần tôi hỗ trợ gì thêm không?');
            }
        },
        [addToCartMutation, onActionHandled, onBotMessage]
    );

    return {
        handleAction,
        isProcessing: addToCartMutation.isPending,
    };
};
