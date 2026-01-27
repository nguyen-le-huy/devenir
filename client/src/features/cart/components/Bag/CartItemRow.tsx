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
            {/* Note: The original Bag.tsx didn't have an visible Edit button on the row, 
                 it just showed the list. Wait, looking at Bag.tsx, I don't see an explicit "Edit" button 
                 invocation there. 
                 Ah, I see EditItem component exists, but where is it used?
                 I checked Bag.tsx content in Step 13, I DO NOT SEE EditItem being used in Bag.tsx.
                 Wait, maybe it's used in a different specific cart page? Or maybe I missed it?
                 Step 13 Bag.tsx content does NOT import EditItem.
                 So `EditItem` might be unused or used elsewhere (e.g. valid cart page).
                 However, the user asked to check the FOLDER. `EditItem` is inside `components/EditItem`.
                 The prompt implied refactoring the whole folder.
                 If Bag.tsx is a "mini-cart" (Bag), maybe it doesn't allow editing deeply?
                 Wait, looking at my `CartItemRow` implementation above, I added `onEdit`.
                 If Bag.tsx doesn't use it, that's fine.
                 
                 BUT, if Bag.tsx is the only place listing items, how does user edit?
                 The user *mentioned* `EditItem` exists.
                 Maybe `EditItem` is triggered by clicking something?
                 In Bag.tsx, clicking image/name navigates to product detail.
                 There is NO edit button in Bag.tsx.
                 
                 Unless... I should ADD it?
                 "Refactor... to meet enterprise standards".
                 Usually a cart allows removing/editing quantity.
                 Bag.tsx seems to be a read-only list + Checkout button.
                 
                 Wait, the original `EditItem.tsx` logic has `updateCartMutation`, `addToCartMutation`, `removeFromCartMutation`.
                 It seems designed to be used.
                 Maybe it's used in a full `/cart` page that is not in this folder?
                 The folder structure is:
                 features/cart/
                   api/
                   components/
                     Bag/
                     EditItem/
                   hooks/
                   types/
                   
                 I should check if there is a `pages` folder in `features/cart`?
                 `ls -R` in Step 4 showed:
                 api, components, hooks, types. NO `pages`.
                 So where is the cart page? Maybe `Bag` IS the main cart?
                 Or maybe it's in `pages/CartPage` somewhere else?
                 
                 If the user says "check entire folder features/cart", and EditItem is there, it must be relevant.
                 If it is unused, I should probably leave it alone or connect it if it makes sense.
                 BUT, `Bag.tsx` seems to be the "Sliding Cart" (Drawer).
                 Usually Drawers have +/- or Remove buttons.
                 The current `Bag.tsx` is *very* simple. Just lists items.
                 
                 "Refactor... to meet enterprise standards".
                 Enterprise cart drawer SHOULD allow editing quantity or removing.
                 The `EditItem` component seems perfect for a modal interaction.
                 
                 I will assume I should integrate `EditItem` into `Bag` or at least prepare `Bag` to open it.
                 Or, simpler: Just refactor `Bag.tsx` to be strict typed first.
                 I'll add `CartItemRow` without Edit button first if the original didn't have it, 
                 OR better: add a simple "Remove" button or +/- controls directly in the row?
                 
                 The `EditItem.tsx` looks like a Modal (Backdrop, etc).
                 So it's meant to be popped up.
                 
                 Let's stick to strict typing `Bag.tsx` first. I will keep the visual parity but cleaner code.
            */}
        </div>
    );
});

CartItemRow.displayName = 'CartItemRow';
export default CartItemRow;
