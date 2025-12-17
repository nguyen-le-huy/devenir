import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './ChatMessage.module.css';
import { getOptimizedImageUrl } from '../../utils/imageOptimization';

// Optimized streaming text component
const StreamingText = memo(({ text, onComplete, speed = 15 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const rafRef = useRef(null);
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        if (!text) return;

        // Reset for new message
        indexRef.current = 0;
        setDisplayedText('');
        setIsComplete(false);

        const animate = (timestamp) => {
            // Throttle updates for performance (every ~15ms = ~66fps)
            if (timestamp - lastUpdateRef.current < speed) {
                rafRef.current = requestAnimationFrame(animate);
                return;
            }
            lastUpdateRef.current = timestamp;

            // Add characters in chunks for smoother feel
            const charsPerFrame = 2;
            const nextIndex = Math.min(indexRef.current + charsPerFrame, text.length);

            if (indexRef.current < text.length) {
                setDisplayedText(text.slice(0, nextIndex));
                indexRef.current = nextIndex;
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setIsComplete(true);
                onComplete?.();
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [text, speed, onComplete]);

    // Render text with bold support
    const renderMessage = useCallback((content) => {
        if (!content) return null;
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    }, []);

    return (
        <span className={styles.streamingText}>
            {renderMessage(displayedText)}
            {!isComplete && <span className={styles.cursor}>|</span>}
        </span>
    );
});

StreamingText.displayName = 'StreamingText';

const ChatMessage = memo(({ message, onActionClick, isLatest = false, onStreamComplete }) => {
    const isUser = message.sender === 'user';
    // Only stream if: bot message + latest + hasn't been streamed yet
    const shouldStream = !isUser && isLatest && !message.isStreamed;

    const [showProducts, setShowProducts] = useState(!shouldStream);
    const [showActions, setShowActions] = useState(!shouldStream);

    // Handle streaming complete
    const handleStreamComplete = useCallback(() => {
        // Show products/actions after text finishes streaming
        setShowProducts(true);
        setShowActions(true);
        // Notify parent to mark message as streamed
        if (onStreamComplete) {
            onStreamComplete();
        }
    }, [onStreamComplete]);

    // For non-streaming messages, show everything immediately
    useEffect(() => {
        if (!shouldStream) {
            setShowProducts(true);
            setShowActions(true);
        }
    }, [shouldStream]);

    // Format price to $
    const formatPrice = (price) => {
        return '$' + new Intl.NumberFormat('en-US').format(price);
    };

    // Render message with bold text support (for non-streaming)
    const renderMessage = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Handle action button clicks
    const handleYesClick = () => {
        if (onActionClick && message.suggestedAction) {
            onActionClick(message.id, 'yes', message.suggestedAction);
        }
    };

    const handleNoClick = () => {
        if (onActionClick) {
            onActionClick(message.id, 'no');
        }
    };

    return (
        <div id={`msg-${message.id}`} className={isUser ? styles.userMessage : styles.botMessage}>
            <div className={styles.messageBubble}>
                <p>
                    {/* Use streaming only for new bot messages that haven't been streamed */}
                    {shouldStream ? (
                        <StreamingText
                            text={message.text}
                            onComplete={handleStreamComplete}
                            speed={12}
                        />
                    ) : (
                        renderMessage(message.text)
                    )}
                </p>

                {/* Product Cards - animated entrance */}
                {!isUser && message.suggestedProducts && message.suggestedProducts.length > 0 && showProducts && (
                    <div className={`${styles.products} ${styles.fadeIn}`}>
                        {message.suggestedProducts.map((product) => (
                            <Link
                                to={`/product-detail?variant=${product.variantId || product._id}`}
                                key={product._id}
                                className={`${styles.productCard} ${!product.inStock ? styles.outOfStock : ''}`}
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
                                            : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`
                                        }
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
                            allowFullScreen=""
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 11l19-9-9 19-2-8-8-2z" />
                            </svg>
                            Chỉ đường
                        </a>
                    </div>
                )}

                {/* Action Buttons - Yes/No for Add to Cart */}
                {!isUser && message.suggestedAction && !message.actionHandled && showActions && (
                    <div className={`${styles.actionButtons} ${styles.fadeIn}`}>
                        <p className={styles.actionPrompt}>{message.suggestedAction.prompt}</p>
                        <div className={styles.buttonGroup}>
                            <button
                                className={styles.yesButton}
                                onClick={handleYesClick}
                            >
                                Có, thêm vào giỏ
                            </button>
                            <button
                                className={styles.noButton}
                                onClick={handleNoClick}
                            >
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
