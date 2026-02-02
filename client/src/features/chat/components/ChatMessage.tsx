
/**
 * ChatMessage Component
 * Displays individual chat messages with streaming animation
 * Refactored to use extracted sub-components
 */

import { memo, useState, useEffect, useCallback } from 'react';
import styles from './ChatMessage.module.css';
import StreamingText from './StreamingText';
import { parseBoldText } from '../utils/chatValidation';
import type { ChatMessage as ChatMessageType, SuggestedAction, ActionType } from '../types';
import { DirectionsIcon } from './icons';
import ChatProductCard from './ChatProductCard';
import ChatActionButtons from './ChatActionButtons';

interface ChatMessageProps {
    message: ChatMessageType;
    onActionClick: (
        id: string | number,
        action: ActionType,
        actionData?: SuggestedAction
    ) => void;
    isLatest?: boolean;
    onStreamComplete?: () => void;
}

/**
 * ChatMessage Component
 * Renders user or bot messages with optional products, actions, and location
 */
const ChatMessage = memo<ChatMessageProps>(({
    message,
    onActionClick,
    isLatest = false,
    onStreamComplete,
}) => {
    const isUser = message.sender === 'user';

    // Only stream if: bot message + latest + hasn't been streamed yet
    const shouldStream = !isUser && isLatest && !message.isStreamed;

    const [showProducts, setShowProducts] = useState(!shouldStream);
    const [showActions, setShowActions] = useState(!shouldStream);

    /**
     * Handle streaming complete
     * Show products/actions after text finishes streaming
     */
    const handleStreamComplete = useCallback(() => {
        setShowProducts(true);
        setShowActions(true);
        onStreamComplete?.();
    }, [onStreamComplete]);

    /**
     * For non-streaming messages, show everything immediately
     */
    useEffect(() => {
        if (!shouldStream) {
            setShowProducts(true);
            setShowActions(true);
        }
    }, [shouldStream]);

    /**
     * Render message with bold text support (for non-streaming)
     */
    const renderMessage = useCallback((text: string) => {
        if (!text) return null;

        const parts = parseBoldText(text);

        return parts.map((part, index) => {
            if (part.bold) {
                return <strong key={index}>{part.text}</strong>;
            }
            return <span key={index}>{part.text}</span>;
        });
    }, []);

    /**
     * Handle action button clicks
     */
    const handleYesClick = useCallback(() => {
        if (onActionClick && message.suggestedAction) {
            onActionClick(message.id, 'yes', message.suggestedAction);
        }
    }, [onActionClick, message.id, message.suggestedAction]);

    const handleNoClick = useCallback(() => {
        if (onActionClick) {
            onActionClick(message.id, 'no');
        }
    }, [onActionClick, message.id]);

    return (
        <div
            id={`msg-${message.id}`}
            className={isUser ? styles.userMessage : styles.botMessage}
        >
            <div className={styles.messageBubble}>
                <p>
                    {/* Use streaming only for new bot messages that haven't been streamed */}
                    {shouldStream ? (
                        <StreamingText
                            text={message.text}
                            onComplete={handleStreamComplete}
                        />
                    ) : (
                        renderMessage(message.text)
                    )}
                </p>

                {/* Product Cards - animated entrance */}
                {!isUser &&
                    message.suggestedProducts &&
                    message.suggestedProducts.length > 0 &&
                    showProducts && (
                        <div className={`${styles.products} ${styles.fadeIn}`}>
                            {message.suggestedProducts.map((product) => (
                                <ChatProductCard
                                    key={product._id}
                                    product={product}
                                />
                            ))}
                        </div>
                    )}

                {/* Store Location Map */}
                {!isUser && message.storeLocation && showProducts && (
                    <div className={`${styles.mapContainer} ${styles.fadeIn}`}>
                        <iframe
                            src={message.storeLocation.googleMapsEmbedUrl}
                            width="100%"
                            height="200"
                            style={{ border: 0, borderRadius: '8px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Store Location"
                        />
                        <a
                            href={message.storeLocation.directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.directionsButton}
                        >
                            <DirectionsIcon width={16} height={16} />
                            Chỉ đường
                        </a>
                    </div>
                )}

                {/* Action Buttons - Yes/No for Add to Cart */}
                {!isUser &&
                    message.suggestedAction &&
                    !message.actionHandled &&
                    showActions && (
                        <ChatActionButtons
                            prompt={message.suggestedAction.prompt}
                            onYes={handleYesClick}
                            onNo={handleNoClick}
                        />
                    )}

                {/* Action Result Feedback */}
                {message.actionHandled && message.actionResult === 'added' && (
                    <div className={styles.actionFeedback}>
                        <span className={styles.successIcon}>✓</span>
                        <span>Đã thêm vào giỏ hàng</span>
                    </div>
                )}
            </div>
        </div>
    );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
