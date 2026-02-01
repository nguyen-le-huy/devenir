/**
 * ChatMessage Component
 * Displays individual chat messages with streaming animation
 * Refactored to use extracted StreamingText component
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './ChatMessage.module.css';
import StreamingText from './StreamingText';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import { parseBoldText } from '../utils/chatValidation';
import type { ChatMessage as ChatMessageType, SuggestedAction, ActionType } from '../types';
import { DirectionsIcon } from './ChatIcons';

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
     * Format price to USD
     */
    const formatPrice = useCallback((price: number): string => {
        return '$' + new Intl.NumberFormat('en-US').format(price);
    }, []);

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
                                <Link
                                    to={`/product-detail?variant=${product.variantId || product._id}`}
                                    key={product._id}
                                    className={`${styles.productCard} ${!product.inStock ? styles.outOfStock : ''
                                        }`}
                                >
                                    {product.mainImage && (
                                        <div className={styles.imageWrapper}>
                                            <img
                                                src={getOptimizedImageUrl(product.mainImage)}
                                                alt={product.name}
                                                loading="lazy"
                                            />
                                            {!product.inStock && (
                                                <div className={styles.outOfStockOverlay}>
                                                    <span>Hết hàng</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className={styles.productInfo}>
                                        <span className={styles.productName}>{product.name}</span>
                                        <span className={styles.productPrice}>
                                            {product.minPrice === product.maxPrice
                                                ? formatPrice(product.minPrice)
                                                : `${formatPrice(product.minPrice)} - ${formatPrice(
                                                    product.maxPrice
                                                )}`}
                                        </span>
                                    </div>
                                </Link>
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
                        <div className={`${styles.actionButtons} ${styles.fadeIn}`}>
                            <p className={styles.actionPrompt}>
                                {message.suggestedAction.prompt}
                            </p>
                            <div className={styles.buttonGroup}>
                                <button className={styles.yesButton} onClick={handleYesClick}>
                                    Có, thêm vào giỏ
                                </button>
                                <button className={styles.noButton} onClick={handleNoClick}>
                                    Không, cảm ơn
                                </button>
                            </div>
                        </div>
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
