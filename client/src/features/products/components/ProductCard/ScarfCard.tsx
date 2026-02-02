import { useState, useMemo, useCallback, memo, MouseEvent } from 'react';
import styles from './ScarfCard.module.css';
import { Link } from 'react-router-dom';
import { getLazyLoadProps, getOptimizedImageUrl } from '@/shared/utils/imageOptimization';
import type { IScarfCardProps, IEnrichedVariant } from '@/features/products/types';
import { getColorName } from '@/features/products/utils/productUtils';

interface IActiveVariant {
    id: string;
    name: string;
    price: number;
    image: string;
    imageHover: string;
    color: string;
    colorHex: string;
}

/**
 * ScarfCard - Product card with color variants
 * 
 * @param {IScarfCardProps} props - Component props
 */
const ScarfCard = memo(({ scarf, colorVariants = [] }: IScarfCardProps) => {
    // State for current displayed variant
    const [activeVariant, setActiveVariant] = useState<IActiveVariant | null>(null);

    // Get the product ID from scarf data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productId = (scarf as any).productId || scarf.product_id || (scarf as IEnrichedVariant).productInfo?._id;

    // Process color variants - get unique colors only, with current color first
    const uniqueColorVariants: IActiveVariant[] = useMemo(() => {
        if (!colorVariants || colorVariants.length === 0) {
            return [];
        }

        // Filter variants that belong to the same product
        const sameProductVariants = colorVariants.filter(v => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const variantProductId = (v as any).productId || v.product_id || (v as IEnrichedVariant).productInfo?._id;
            return variantProductId === productId;
        });

        // Get unique colors (one variant per color)
        const colorMap = new Map<string, IActiveVariant>();

        sameProductVariants.forEach(variant => {
            // Use util to safely get color name
            const colorRaw = variant.color;
            const color = getColorName(colorRaw).toLowerCase();

            // Use type assertion for optional properties that might be present in enriched data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const vAny = variant as any;

            if (color && !colorMap.has(color)) {
                colorMap.set(color, {
                    id: variant._id,
                    color: getColorName(colorRaw),
                    colorHex: vAny.colorHex || vAny.colorCode || '#ccc',
                    image: variant.mainImage,
                    imageHover: variant.hoverImage || variant.mainImage,
                    price: variant.price,
                    name: variant.name || (variant as IEnrichedVariant).productInfo?.name || scarf.name || 'Product'
                });
            }
        });

        // Convert to array and sort: current color first
        const variants = Array.from(colorMap.values());
        const originalColor = getColorName(scarf.color).toLowerCase();

        // Sort to put the original/current color first
        variants.sort((a, b) => {
            const aIsOriginal = a.color?.toLowerCase() === originalColor;
            const bIsOriginal = b.color?.toLowerCase() === originalColor;
            if (aIsOriginal && !bIsOriginal) return -1;
            if (!aIsOriginal && bIsOriginal) return 1;
            return 0;
        });

        return variants;
    }, [colorVariants, productId, scarf]);

    // Current color of the scarf (for display, not for sorting)
    const scarfColor = getColorName(scarf.color);
    const currentColor = (activeVariant?.color || scarfColor || '').toLowerCase();

    // Determine displayed variant (active or original)
    const displayedVariant = useMemo(() => {
        if (activeVariant) {
            return {
                id: activeVariant.id,
                name: activeVariant.name,
                price: activeVariant.price,
                image: activeVariant.image,
                imageHover: activeVariant.imageHover
            };
        }

        return {
            id: scarf._id, // safe access
            name: scarf.name || (scarf as IEnrichedVariant).productInfo?.name || 'Product',
            price: scarf.price,
            image: scarf.mainImage,
            imageHover: scarf.hoverImage || scarf.mainImage
        };
    }, [activeVariant, scarf]);

    // Max colors to display
    const MAX_VISIBLE_COLORS = 4;
    const visibleColors = uniqueColorVariants.slice(0, MAX_VISIBLE_COLORS);
    const remainingCount = uniqueColorVariants.length - MAX_VISIBLE_COLORS;
    const hasColorVariants = uniqueColorVariants.length > 1;

    // Handle color click
    const handleColorClick = useCallback((e: MouseEvent, variant: IActiveVariant) => {
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
                    src={getOptimizedImageUrl(displayedVariant.image)}
                    alt={displayedVariant.name}
                    className={styles.imageDefault}
                    {...getLazyLoadProps()}
                />
                <img
                    src={getOptimizedImageUrl(displayedVariant.imageHover)}
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
});

ScarfCard.displayName = 'ScarfCard';

export default ScarfCard;
