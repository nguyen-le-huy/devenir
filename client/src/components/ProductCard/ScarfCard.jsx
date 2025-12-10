import { useState, useMemo, useCallback } from 'react';
import styles from './ScarfCard.module.css';
import { Link } from 'react-router-dom';
import { getLazyLoadProps } from '../../utils/imageOptimization.js';

/**
 * ScarfCard - Product card with color variants
 * 
 * @param {Object} scarf - Current variant data
 * @param {Array} colorVariants - Optional: Array of sibling variants with different colors
 *                                Each variant should have: _id, color, colorHex, mainImage, hoverImage
 */
const ScarfCard = ({ scarf, colorVariants = [] }) => {
    // State for current displayed variant
    const [activeVariant, setActiveVariant] = useState(null);

    // Get the product ID from scarf data
    const productId = scarf.productId || scarf.product_id || scarf.productInfo?._id;

    // Process color variants - get unique colors only, with current color first
    const uniqueColorVariants = useMemo(() => {
        if (!colorVariants || colorVariants.length === 0) {
            return [];
        }

        // Filter variants that belong to the same product
        const sameProductVariants = colorVariants.filter(v => {
            const variantProductId = v.productId || v.product_id || v.productInfo?._id;
            return variantProductId === productId;
        });

        // Get unique colors (one variant per color)
        const colorMap = new Map();
        sameProductVariants.forEach(variant => {
            const color = variant.color?.toLowerCase();
            if (color && !colorMap.has(color)) {
                colorMap.set(color, {
                    id: variant._id || variant.id,
                    color: variant.color,
                    colorHex: variant.colorHex || variant.colorCode || '#ccc',
                    mainImage: variant.mainImage,
                    hoverImage: variant.hoverImage || variant.mainImage,
                    price: variant.price,
                    name: variant.name || variant.productInfo?.name || scarf.name
                });
            }
        });

        // Convert to array and sort: current color first
        const variants = Array.from(colorMap.values());
        const originalColor = (scarf.color || '').toLowerCase();

        // Sort to put the original/current color first
        variants.sort((a, b) => {
            const aIsOriginal = a.color?.toLowerCase() === originalColor;
            const bIsOriginal = b.color?.toLowerCase() === originalColor;
            if (aIsOriginal && !bIsOriginal) return -1;
            if (!aIsOriginal && bIsOriginal) return 1;
            return 0;
        });

        return variants;
    }, [colorVariants, productId, scarf.color]);

    // Current color of the scarf (for display, not for sorting)
    const currentColor = (activeVariant?.color || scarf.color || '').toLowerCase();

    // Determine displayed variant (active or original)
    const displayedVariant = useMemo(() => {
        if (activeVariant) {
            return {
                id: activeVariant.id,
                name: activeVariant.name || scarf.name,
                price: activeVariant.price || scarf.price,
                image: activeVariant.mainImage || scarf.image,
                imageHover: activeVariant.hoverImage || activeVariant.mainImage || scarf.imageHover
            };
        }
        return {
            id: scarf.id,
            name: scarf.name,
            price: scarf.price,
            image: scarf.image,
            imageHover: scarf.imageHover
        };
    }, [activeVariant, scarf]);

    // Max colors to display
    const MAX_VISIBLE_COLORS = 4;
    const visibleColors = uniqueColorVariants.slice(0, MAX_VISIBLE_COLORS);
    const remainingCount = uniqueColorVariants.length - MAX_VISIBLE_COLORS;
    const hasColorVariants = uniqueColorVariants.length > 1;

    // Handle color click
    const handleColorClick = useCallback((e, variant) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveVariant(variant);
    }, []);

    return (
        <Link
            to={`/product-detail?variant=${displayedVariant.id}`}
            className={styles.scarfCard}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.imageWrapper}>
                <img
                    src={displayedVariant.image}
                    alt={displayedVariant.name}
                    className={styles.imageDefault}
                    {...getLazyLoadProps()}
                />
                <img
                    src={displayedVariant.imageHover}
                    alt={`${displayedVariant.name} hover`}
                    className={styles.imageHover}
                    {...getLazyLoadProps()}
                />
            </div>
            <div className={styles.scarfInfo}>
                <h4 className={styles.scarfName}>{displayedVariant.name}</h4>
                <p className={styles.scarfPrice}>${displayedVariant.price}</p>
            </div>

            {/* Color Variants - only show if there are multiple colors */}
            {hasColorVariants && (
                <div className={styles.colorVariants}>
                    {visibleColors.map((variant) => {
                        const isActive = variant.color?.toLowerCase() === currentColor;
                        return (
                            <span
                                key={variant.id}
                                className={`${styles.color} ${isActive ? styles.active : ''}`}
                                style={{ backgroundColor: variant.colorHex }}
                                onClick={(e) => handleColorClick(e, variant)}
                                title={variant.color}
                            />
                        );
                    })}
                    {remainingCount > 0 && (
                        <p className={styles.moreColors}>+{remainingCount}</p>
                    )}
                </div>
            )}
        </Link>
    );
};

export default ScarfCard;