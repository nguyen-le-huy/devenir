import { Link } from 'react-router-dom';
import styles from './ChatMessage.module.css';

const ChatMessage = ({ message, onActionClick }) => {
    const isUser = message.sender === 'user';

    // Format price to $
    const formatPrice = (price) => {
        return '$' + new Intl.NumberFormat('en-US').format(price);
    };

    // Render message with bold text support
    const renderMessage = (text) => {
        if (!text) return null;
        // Split by ** to find bold parts
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
                <p>{renderMessage(message.text)}</p>

                {/* Product Cards */}
                {!isUser && message.suggestedProducts && message.suggestedProducts.length > 0 && (
                    <div className={styles.products}>
                        {message.suggestedProducts.map((product) => (
                            <Link
                                to={`/product-detail?variant=${product.variantId || product._id}`}
                                key={product._id}
                                className={`${styles.productCard} ${!product.inStock ? styles.outOfStock : ''}`}
                            >
                                {product.mainImage && (
                                    <div className={styles.imageWrapper}>
                                        <img
                                            src={product.mainImage}
                                            alt={product.name}
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

                {/* Action Buttons - Yes/No for Add to Cart */}
                {!isUser && message.suggestedAction && !message.actionHandled && (
                    <div className={styles.actionButtons}>
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
};

export default ChatMessage;
