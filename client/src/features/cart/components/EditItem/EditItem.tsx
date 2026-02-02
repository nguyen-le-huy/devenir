import styles from './EditItem.module.css';
import { toast } from 'sonner';
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useProductVariants } from '@/features/products/hooks/useProducts';
import { useUpdateCartItem, useAddToCart, useRemoveFromCart } from '@/features/cart/hooks/useCart';
import Backdrop from '@/shared/components/Backdrop/Backdrop';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import { ICartItem } from '@/features/cart/types';
import { SIZE_OPTIONS, TOAST_MESSAGES } from '@/features/cart/utils/constants';
import { getColorName, findVariantByAttributes, getAvailableSizes } from '@/features/cart/utils/cartCalculations';
import QuantitySelector from './QuantitySelector';
import SizeSelector from './SizeSelector';

interface EditItemProps {
    item: ICartItem;
    onClose: () => void;
}

/**
 * EditItem Modal Component
 * 
 * Allows users to edit cart item quantity and size.
 * Uses presentational sub-components for better maintainability.
 */
const EditItem = ({ item, onClose }: EditItemProps) => {
    // Defensive check - get variant first
    const variant = item.productVariant || item.variant;
    const product = variant?.product_id;
    const productId = product?._id;
    const productName = product?.name || 'Product';
    const image = variant?.mainImage || '/images/placeholder.png';
    const initialSize = variant?.size || '';
    const color = getColorName(variant?.color);
    const initialQuantity = item.quantity || 1;
    const isFreeSize = initialSize === 'Free Size' || !initialSize;

    // ✅ ALL HOOKS MUST BE AT THE TOP - React Hooks Rules
    const [isVisible, setIsVisible] = useState(false);
    const [quantity, setQuantity] = useState(initialQuantity);
    const [selectedSize, setSelectedSize] = useState(initialSize);

    // Lock scroll when EditItem is opened
    useLenisControl(true);

    // Fetch all variants of this product  
    const { data: variantsData } = useProductVariants(productId);
    const variants = variantsData?.data || [];

    // Mutations
    const updateCartMutation = useUpdateCartItem();
    const addToCartMutation = useAddToCart();
    const removeFromCartMutation = useRemoveFromCart();

    const isPending = updateCartMutation.isPending || addToCartMutation.isPending || removeFromCartMutation.isPending;

    // Get available sizes with stock status using utility function
    const availableSizes = useMemo(() => {
        if (isFreeSize) return [];
        return getAvailableSizes(variants, color, SIZE_OPTIONS);
    }, [variants, color, isFreeSize]);

    // Handlers
    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const handleSave = useCallback(() => {
        const sizeChanged = !isFreeSize && selectedSize !== initialSize;
        const quantityChanged = quantity !== initialQuantity;

        if (!sizeChanged && !quantityChanged) {
            handleClose();
            return;
        }

        if (sizeChanged) {
            // Size changed: Remove old variant and add new variant
            const newVariant = findVariantByAttributes(variants, color, selectedSize);

            if (!newVariant) {
                toast.error(TOAST_MESSAGES.ERROR);
                return;
            }

            // Chain: Remove -> Add
            removeFromCartMutation.mutate(variant?._id || '', {
                onSuccess: () => {
                    addToCartMutation.mutate(
                        { variantId: newVariant._id, quantity },
                        {
                            onSuccess: () => {
                                handleClose();
                            },
                        }
                    );
                },
            });
        } else {
            // Only quantity changed: Just update
            updateCartMutation.mutate(
                { variantId: variant?._id || '', quantity },
                {
                    onSuccess: () => {
                        handleClose();
                    },
                }
            );
        }
    }, [
        isFreeSize,
        selectedSize,
        initialSize,
        quantity,
        initialQuantity,
        variants,
        color,
        variant?._id,
        removeFromCartMutation,
        addToCartMutation,
        updateCartMutation,
        handleClose,
    ]);

    // Trigger animation after component mounts
    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    // Close if invalid item
    useEffect(() => {
        if (!variant) {
            onClose();
        }
    }, [variant, onClose]);

    // ✅ NOW conditional return is AFTER all hooks
    if (!variant) return null;

    return (
        <div data-lenis-prevent>
            <Backdrop visible={isVisible} onClick={handleClose} opacity={0.7} />
            <div className={`${styles.editItem} ${isVisible ? styles.visible : ''}`} data-lenis-prevent>
                {/* Header */}
                <div className={styles.header}>
                    <p>Edit Item</p>
                    <svg
                        onClick={handleClose}
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{ cursor: 'pointer' }}
                    >
                        <path
                            d="M10 11.158L1.41969 19.7383C1.26704 19.891 1.07949 19.9727 0.857049 19.9836C0.634609 19.9945 0.436157 19.9128 0.261694 19.7383C0.0872312 19.5638 0 19.3708 0 19.1593C0 18.9478 0.0872312 18.7548 0.261694 18.5803L8.842 10L0.261694 1.41969C0.109039 1.26704 0.0272594 1.07949 0.0163555 0.857049C0.00545156 0.634609 0.0872312 0.436157 0.261694 0.261694C0.436157 0.0872312 0.629157 0 0.840693 0C1.05223 0 1.24523 0.0872312 1.41969 0.261694L10 8.842L18.5803 0.261694C18.733 0.109039 18.9211 0.0272594 19.1446 0.0163555C19.3659 0.00545156 19.5638 0.0872312 19.7383 0.261694C19.9128 0.436157 20 0.629157 20 0.840693C20 1.05223 19.9128 1.24523 19.7383 1.41969L11.158 10L19.7383 18.5803C19.891 18.733 19.9727 18.9211 19.9836 19.1446C19.9945 19.3659 19.9128 19.5638 19.7383 19.7383C19.5638 19.9128 19.3708 20 19.1593 20C18.9478 20 18.7548 19.9128 18.5803 19.7383L10 11.158Z"
                            fill="#0E0E0E"
                        />
                    </svg>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <img src={getOptimizedImageUrl(image)} alt={productName} loading="lazy" />
                    <div className={styles.info}>
                        <h2>{productName}</h2>

                        {/* Quantity Selector */}
                        <div className={styles.selectQuantity}>
                            <p>Select quantity:</p>
                            <QuantitySelector
                                value={quantity}
                                onChange={setQuantity}
                                min={1}
                                max={999}
                                disabled={isPending}
                            />
                        </div>

                        {/* Size Selector - Desktop */}
                        {!isFreeSize && (
                            <div className={`${styles.selectSize} ${styles.desktopOnly}`}>
                                <p>Select size:</p>
                                <SizeSelector
                                    sizes={availableSizes}
                                    selected={selectedSize}
                                    onChange={setSelectedSize}
                                    disabled={isPending}
                                />
                            </div>
                        )}

                        {/* Save Button - Desktop */}
                        <div
                            className={`${styles.button} ${styles.desktopOnly}`}
                            onClick={handleSave}
                            style={{
                                opacity: isPending ? 0.6 : 1,
                                cursor: isPending ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isPending ? 'Saving...' : 'Save'}
                        </div>
                    </div>
                </div>

                {/* Size Selector - Mobile */}
                {!isFreeSize && (
                    <div className={`${styles.selectSize} ${styles.mobileOnly}`}>
                        <p>Select size:</p>
                        <SizeSelector
                            sizes={availableSizes}
                            selected={selectedSize}
                            onChange={setSelectedSize}
                            disabled={isPending}
                        />
                    </div>
                )}

                {/* Save Button - Mobile */}
                <div
                    className={`${styles.button} ${styles.mobileOnly}`}
                    onClick={handleSave}
                    style={{
                        opacity: isPending ? 0.6 : 1,
                        cursor: isPending ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isPending ? 'Saving...' : 'Save'}
                </div>
            </div>
        </div>
    );
};

export default EditItem;
