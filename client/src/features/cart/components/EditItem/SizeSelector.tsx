/**
 * Size Selector Component
 * 
 * Presentational component for selecting product size.
 * Shows stock availability and handles selection.
 * 
 * @module features/cart/components/EditItem/SizeSelector
 */

import { memo } from 'react';
import styles from './EditItem.module.css';

export interface SizeOption {
    /** Size value (e.g., 'M', 'L', 'XL') */
    size: string;
    /** Whether this size is in stock */
    inStock: boolean;
    /** Optional variant ID for this size */
    variantId?: string;
}

interface SizeSelectorProps {
    /** Array of available sizes with stock status */
    sizes: SizeOption[];
    /** Currently selected size */
    selected: string;
    /** Callback when size is selected */
    onChange: (size: string) => void;
    /** Disabled state */
    disabled?: boolean;
}

/**
 * SizeSelector - Pure presentational component
 * 
 * Features:
 * - Grid layout for sizes
 * - Visual feedback for out-of-stock items
 * - Selected state indication
 * - Keyboard accessible
 * 
 * @example
 * ```tsx
 * <SizeSelector
 *   sizes={[
 *     { size: 'M', inStock: true, variantId: '123' },
 *     { size: 'L', inStock: false },
 *   ]}
 *   selected="M"
 *   onChange={handleSizeChange}
 * />
 * ```
 */
const SizeSelector = memo<SizeSelectorProps>(({ sizes, selected, onChange, disabled = false }) => {
    const handleSizeClick = (size: string, inStock: boolean) => {
        if (inStock && !disabled) {
            onChange(size);
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent,
        size: string,
        inStock: boolean
    ) => {
        if ((e.key === 'Enter' || e.key === ' ') && inStock && !disabled) {
            e.preventDefault();
            onChange(size);
        }
    };

    return (
        <div className={styles.selector}>
            {sizes.map(({ size, inStock }) => {
                const isSelected = selected === size;
                const isClickable = inStock && !disabled;

                return (
                    <p
                        key={size}
                        className={`
                            ${!inStock ? styles.outOfStock : ''}
                            ${isSelected ? styles.selected : ''}
                        `.trim()}
                        onClick={() => handleSizeClick(size, inStock)}
                        onKeyDown={(e) => handleKeyDown(e, size, inStock)}
                        role="button"
                        tabIndex={isClickable ? 0 : -1}
                        aria-label={`Size ${size}${!inStock ? ' (Out of stock)' : ''}${
                            isSelected ? ' (Selected)' : ''
                        }`}
                        aria-pressed={isSelected}
                        aria-disabled={!inStock || disabled}
                        style={{
                            cursor: isClickable ? 'pointer' : 'not-allowed',
                            opacity: inStock && !disabled ? 1 : 0.5,
                        }}
                    >
                        {size}
                    </p>
                );
            })}
        </div>
    );
});

SizeSelector.displayName = 'SizeSelector';

export default SizeSelector;
