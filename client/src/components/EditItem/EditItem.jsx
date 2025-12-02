import styles from './EditItem.module.css';
import { useLenisControl } from '../../hooks/useLenisControl';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useProductVariants } from '../../hooks/useProducts';
import { useUpdateCartItem, useAddToCart, useRemoveFromCart } from '../../hooks/useCart';

const EditItem = ({ item, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Lock scroll when EditItem is opened
    useLenisControl(true);

    // Extract data from item
    const variant = item?.productVariant;
    const productId = variant?.product_id?._id || variant?.product_id;
    const productName = variant?.product_id?.name || 'Product';
    const image = variant?.mainImage || '/images/placeholder.png';
    const price = variant?.price || 0;
    const initialSize = variant?.size || '';
    const color = variant?.color || '';
    const initialQuantity = item?.quantity || 1;

    // State for editing
    const [quantity, setQuantity] = useState(initialQuantity);
    const [selectedSize, setSelectedSize] = useState(initialSize);

    // Check if product is Free Size
    const isFreeSize = initialSize === 'Free Size' || !initialSize;

    // Fetch all variants of this product to check stock
    const { data: variantsData } = useProductVariants(productId);
    const variants = variantsData?.data || [];

    // Mutations
    const updateCartMutation = useUpdateCartItem();
    const addToCartMutation = useAddToCart();
    const removeFromCartMutation = useRemoveFromCart();

    // Trigger animation after component mounts
    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    // Get available sizes with stock status
    const availableSizes = useMemo(() => {
        if (isFreeSize) return [];

        const sizeList = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

        return sizeList.map(size => {
            // Find variant with same color and this size
            const sizeVariant = variants.find(v =>
                v.color === color && v.size === size
            );

            return {
                size,
                inStock: sizeVariant ? sizeVariant.stock > 0 : false,
                variantId: sizeVariant?._id
            };
        });
    }, [variants, color, isFreeSize]);

    // Handlers with useCallback for performance
    const handleIncreaseQuantity = useCallback(() => {
        setQuantity(prev => prev + 1);
    }, []);

    const handleDecreaseQuantity = useCallback(() => {
        setQuantity(prev => Math.max(1, prev - 1)); // Min = 1
    }, []);

    const handleSizeClick = useCallback((size, inStock) => {
        if (inStock) {
            setSelectedSize(size);
        }
    }, []);

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const handleSave = useCallback(() => {
        const sizeChanged = !isFreeSize && selectedSize !== initialSize;
        const quantityChanged = quantity !== initialQuantity;

        if (!sizeChanged && !quantityChanged) {
            // No changes, just close
            handleClose();
            return;
        }

        if (sizeChanged) {
            // Size changed: Remove old variant and add new variant
            const newVariant = variants.find(v =>
                v.color === color && v.size === selectedSize
            );

            if (!newVariant) {
                alert('Selected size is not available');
                return;
            }

            // First remove old variant, then add new variant
            removeFromCartMutation.mutate(variant._id, {
                onSuccess: () => {
                    // After removing, add new variant with new quantity
                    addToCartMutation.mutate(
                        { variantId: newVariant._id, quantity },
                        {
                            onSuccess: () => {
                                handleClose();
                            },
                            onError: (error) => {
                                alert(error.message || 'Failed to add new size');
                            }
                        }
                    );
                },
                onError: (error) => {
                    alert(error.message || 'Failed to update item');
                }
            });
        } else {
            // Only quantity changed: Just update
            updateCartMutation.mutate(
                { variantId: variant._id, quantity },
                {
                    onSuccess: () => {
                        handleClose();
                    },
                    onError: (error) => {
                        alert(error.message || 'Failed to update quantity');
                    }
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
        variant._id,
        removeFromCartMutation,
        addToCartMutation,
        updateCartMutation,
        handleClose
    ]);

    return (
        <div data-lenis-prevent>
            <div className={`${styles.backdrop} ${isVisible ? styles.visible : ''}`} onClick={handleClose}></div>
            <div className={`${styles.editItem} ${isVisible ? styles.visible : ''}`} data-lenis-prevent>
                <div className={styles.header}>
                    <p>Edit Item</p>
                    <svg onClick={handleClose} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ cursor: 'pointer' }}>
                        <path d="M10 11.158L1.41969 19.7383C1.26704 19.891 1.07949 19.9727 0.857049 19.9836C0.634609 19.9945 0.436157 19.9128 0.261694 19.7383C0.0872312 19.5638 0 19.3708 0 19.1593C0 18.9478 0.0872312 18.7548 0.261694 18.5803L8.842 10L0.261694 1.41969C0.109039 1.26704 0.0272594 1.07949 0.0163555 0.857049C0.00545156 0.634609 0.0872312 0.436157 0.261694 0.261694C0.436157 0.0872312 0.629157 0 0.840693 0C1.05223 0 1.24523 0.0872312 1.41969 0.261694L10 8.842L18.5803 0.261694C18.733 0.109039 18.9211 0.0272594 19.1446 0.0163555C19.3659 0.00545156 19.5638 0.0872312 19.7383 0.261694C19.9128 0.436157 20 0.629157 20 0.840693C20 1.05223 19.9128 1.24523 19.7383 1.41969L11.158 10L19.7383 18.5803C19.891 18.733 19.9727 18.9211 19.9836 19.1446C19.9945 19.3659 19.9128 19.5638 19.7383 19.7383C19.5638 19.9128 19.3708 20 19.1593 20C18.9478 20 18.7548 19.9128 18.5803 19.7383L10 11.158Z" fill="#0E0E0E" />
                    </svg>
                </div>
                <div className={styles.body}>
                    <img src={image} alt={productName} />
                    <div className={styles.info}>
                        <h2>{productName}</h2>
                        <div className={styles.selectQuantity}>
                            <p>Select quantity:</p>
                            <div className={styles.selector}>
                                <svg
                                    onClick={handleDecreaseQuantity}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="15"
                                    height="1"
                                    viewBox="0 0 15 1"
                                    fill="none"
                                    style={{ cursor: 'pointer', opacity: quantity > 1 ? 1 : 0.3 }}
                                >
                                    <path d="M0 1V0H15V1H0Z" fill="#0E0E0E" />
                                </svg>
                                <p>{quantity}</p>
                                <svg
                                    onClick={handleIncreaseQuantity}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <path d="M0 8.07692V6.92308H6.92308V0H8.07692V6.92308H15V8.07692H8.07692V15H6.92308V8.07692H0Z" fill="#0E0E0E" />
                                </svg>
                            </div>
                        </div>
                        {/* Desktop: selectSize & button in .info */}
                        {!isFreeSize && (
                            <div className={`${styles.selectSize} ${styles.desktopOnly}`}>
                                <p>Select size:</p>
                                <div className={styles.selector}>
                                    {availableSizes.map(({ size, inStock }) => (
                                        <p
                                            key={size}
                                            className={`
                                                ${!inStock ? styles.outOfStock : ''}
                                                ${selectedSize === size ? styles.selected : ''}
                                            `}
                                            onClick={() => handleSizeClick(size, inStock)}
                                            style={{
                                                cursor: inStock ? 'pointer' : 'not-allowed',
                                                opacity: inStock ? 1 : 0.5
                                            }}
                                        >
                                            {size}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div
                            className={`${styles.button} ${styles.desktopOnly}`}
                            onClick={handleSave}
                            style={{
                                opacity: (updateCartMutation.isLoading || addToCartMutation.isLoading || removeFromCartMutation.isLoading) ? 0.6 : 1,
                                cursor: (updateCartMutation.isLoading || addToCartMutation.isLoading || removeFromCartMutation.isLoading) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {(updateCartMutation.isLoading || addToCartMutation.isLoading || removeFromCartMutation.isLoading) ? 'Saving...' : 'Save'}
                        </div>
                    </div>
                </div>
                {/* Mobile: selectSize & button outside .body */}
                {!isFreeSize && (
                    <div className={`${styles.selectSize} ${styles.mobileOnly}`}>
                        <p>Select size:</p>
                        <div className={styles.selector}>
                            {availableSizes.map(({ size, inStock }) => (
                                <p
                                    key={size}
                                    className={`
                                        ${!inStock ? styles.outOfStock : ''}
                                        ${selectedSize === size ? styles.selected : ''}
                                    `}
                                    onClick={() => handleSizeClick(size, inStock)}
                                    style={{
                                        cursor: inStock ? 'pointer' : 'not-allowed',
                                        opacity: inStock ? 1 : 0.5
                                    }}
                                >
                                    {size}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
                <div
                    className={`${styles.button} ${styles.mobileOnly}`}
                    onClick={handleSave}
                    style={{
                        opacity: (updateCartMutation.isLoading || addToCartMutation.isLoading || removeFromCartMutation.isLoading) ? 0.6 : 1,
                        cursor: (updateCartMutation.isLoading || addToCartMutation.isLoading || removeFromCartMutation.isLoading) ? 'not-allowed' : 'pointer'
                    }}
                >
                    {(updateCartMutation.isLoading || addToCartMutation.isLoading || removeFromCartMutation.isLoading) ? 'Saving...' : 'Save'}
                </div>
            </div>
        </div>
    );
};

export default EditItem;
