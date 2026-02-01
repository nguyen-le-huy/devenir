import { memo } from 'react';
import styles from './Bag.module.css';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import { ICartItem } from '@/features/cart/types';
import { useNavigate } from 'react-router-dom';

interface CartItemRowProps {
    item: ICartItem;
    onClose?: () => void;
    onEdit?: (item: ICartItem) => void;
}

const CartItemRow = memo(({ item, onClose, onEdit }: CartItemRowProps) => {
    const navigate = useNavigate();

    // Defensive coding in case backend structure varies or population fails
    const variant = item.productVariant || item.variant;
    // If populating fails, we might not have product details. Check carefully.
    const product = variant?.product_id;

    if (!variant || !product) {
        // Should Ideally not happen if data integrity is good. 
        // Return minimal or null.
        return null;
    }

    const productName = product.name || 'Product';
    // Prioritize mainImage from variant, fallback to product image (if we had it), then placeholder
    const image = variant.mainImage || '/images/placeholder.png';
    const price = variant.salePrice || variant.basePrice || variant.price || 0;
    const size = variant.size;
    const color = typeof variant.color === 'string' ? variant.color : variant.color?.name;
    const variantId = variant._id;

    const handleProductClick = () => {
        if (onClose) onClose();
        navigate(`/product-detail?variant=${variantId}`);
    };

    return (
        <div className={styles.product}>
            <img
                src={getOptimizedImageUrl(image)}
                alt={productName}
                onClick={handleProductClick}
                style={{ cursor: 'pointer' }}
                loading="lazy"
            />
            <div className={styles.productInfo}>
                <div className={styles.nameAndQuanity}>
                    <p
                        className={styles.productName}
                        onClick={handleProductClick}
                        style={{ cursor: 'pointer' }}
                    >
                        {productName}
                    </p>
                    <p className={styles.productQuantity}>
                        {size && size !== 'Free Size' && `Size: ${size}`}
                        {size && size !== 'Free Size' && color && ' | '}
                        {color && `Color: ${color}`}
                        {(size && size !== 'Free Size') || color ? ' | ' : ''}Qty: {item.quantity}
                    </p>
                </div>
                <div className={styles.priceAndEdit}>
                    <p className={styles.productPrice}>${(price * item.quantity).toFixed(2)}</p>
                    {onEdit && (
                        <button
                            className={styles.editButton}
                            onClick={() => onEdit(item)}
                            aria-label="Edit item"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

CartItemRow.displayName = 'CartItemRow';
export default CartItemRow;
