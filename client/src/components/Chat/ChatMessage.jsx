import { Link } from 'react-router-dom';
import styles from './ChatMessage.module.css';

const ChatMessage = ({ message }) => {
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
                                className={styles.productCard}
                            >
                                {product.mainImage && (
                                    <img
                                        src={product.mainImage}
                                        alt={product.name}
                                    />
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
            </div>
        </div>
    );
};

export default ChatMessage;
