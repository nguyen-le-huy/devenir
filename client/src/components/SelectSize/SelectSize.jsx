import styles from "./SelectSize.module.css";
import { useState } from "react";
import { useLenisControl } from "../../hooks/useLenisControl";
import { useAddToCart } from "../../hooks/useCart.js";
import SizeAndFit from "../SizeAndFit/SizeAndFit.jsx";

const SelectSize = ({ isOpen, onClose, variants = [], currentVariant = null, product = null, onAddToCartSuccess }) => {
    const [isSizeAndFitOpen, setIsSizeAndFitOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);

    // Add to cart mutation
    const addToCartMutation = useAddToCart();

    // Lock scroll khi modal mở using useLenisControl instead of useScrollLock
    useLenisControl(isOpen);

    // Group variants by size with stock info
    const sizeInfo = variants.reduce((acc, variant) => {
        const size = variant.size;
        if (!size) return acc;

        // Check stock với nhiều tên field khác nhau
        const stockQuantity = variant.stockQuantity ?? variant.stock ?? variant.quantity ?? 0;
        const isInStock = stockQuantity > 0;

        if (!acc[size]) {
            acc[size] = {
                size: size,
                inStock: isInStock,
                variant: variant
            };
        } else {
            // Nếu đã có size này rồi, update inStock = true nếu có bất kỳ variant nào còn hàng
            if (isInStock) {
                acc[size].inStock = true;
                acc[size].variant = variant; // Ưu tiên variant còn hàng
            }
        }
        return acc;
    }, {});

    // Standard size order
    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL'];

    // Sort sizes by standard order
    const sortedSizes = Object.values(sizeInfo).sort((a, b) => {
        const indexA = sizeOrder.indexOf(a.size.toUpperCase());
        const indexB = sizeOrder.indexOf(b.size.toUpperCase());

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const handleSizeSelect = (sizeData) => {
        if (sizeData.inStock) {
            setSelectedSize(sizeData.size);

            // Add to cart with selected variant
            const variantId = sizeData.variant._id;
            addToCartMutation.mutate(
                { variantId, quantity: 1 },
                {
                    onSuccess: () => {
                        onClose();
                        // Call callback to show AddToBagNoti
                        if (onAddToCartSuccess) {
                            onAddToCartSuccess();
                        }
                    },
                    onError: (error) => {
                        alert(error.response?.data?.message || 'Failed to add to bag. Please login first.');
                    }
                }
            );
        }
    };

    return (
        <>
            {/* Dark Overlay */}
            <div
                className={styles.backdrop}
                onClick={onClose}
                data-lenis-prevent
            ></div>
            {/* Select Size Panel */}
            <div className={styles.selectSize} data-lenis-prevent>
                <div className={styles.box}>
                    <div className={styles.header}>
                        <span>Select Size</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 13 13"
                            fill="none"
                            onClick={onClose}
                            style={{ cursor: 'pointer' }}
                        >
                            <path d="M6.36875 7.10625L0.904167 12.5708C0.806944 12.6681 0.6875 12.7201 0.545833 12.7271C0.404166 12.734 0.277778 12.6819 0.166667 12.5708C0.0555554 12.4597 0 12.3368 0 12.2021C0 12.0674 0.0555554 11.9444 0.166667 11.8333L5.63125 6.36875L0.166667 0.904167C0.0694443 0.806944 0.0173609 0.6875 0.0104164 0.545833C0.00347196 0.404166 0.0555554 0.277778 0.166667 0.166667C0.277778 0.0555554 0.400694 0 0.535417 0C0.670139 0 0.793056 0.0555554 0.904167 0.166667L6.36875 5.63125L11.8333 0.166667C11.9306 0.0694443 12.0503 0.0173609 12.1927 0.0104164C12.3337 0.00347196 12.4597 0.0555554 12.5708 0.166667C12.6819 0.277778 12.7375 0.400694 12.7375 0.535417C12.7375 0.670139 12.6819 0.793056 12.5708 0.904167L7.10625 6.36875L12.5708 11.8333C12.6681 11.9306 12.7201 12.0503 12.7271 12.1927C12.734 12.3337 12.6819 12.4597 12.5708 12.5708C12.4597 12.6819 12.3368 12.7375 12.2021 12.7375C12.0674 12.7375 11.9444 12.6819 11.8333 12.5708L6.36875 7.10625Z" fill="#0E0E0E" />
                        </svg>
                    </div>
                    <div className={styles.sizeList}>
                        {sortedSizes.length > 0 ? (
                            sortedSizes.map((sizeData) => (
                                sizeData.inStock ? (
                                    <p
                                        key={sizeData.size}
                                        onClick={() => handleSizeSelect(sizeData)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {sizeData.size}
                                    </p>
                                ) : (
                                    <div key={sizeData.size} className={styles.outOfStock}>
                                        <p>{sizeData.size}</p>
                                        <span>Notify Me</span>
                                    </div>
                                )
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', color: '#999' }}>No sizes available</p>
                        )}
                    </div>
                </div>
                <div className={styles.footer}>
                    <p>Model's height: 191cm/6ft 3in. Model wears sze UK M</p>
                    <p className={styles.sizeChart} onClick={() => setIsSizeAndFitOpen(true)}>Size Chart</p>
                </div>
            </div>

            {/* SizeAndFit Modal - nested inside SelectSize */}
            {isSizeAndFitOpen && (
                <SizeAndFit
                    isOpen={isSizeAndFitOpen}
                    onClose={() => setIsSizeAndFitOpen(false)}
                />
            )}
        </>
    );
};

export default SelectSize;
