/**
 * Quantity Selector Component
 * 
 * Presentational component for selecting item quantity.
 * Includes accessibility features (ARIA labels, keyboard support).
 * 
 * @module features/cart/components/EditItem/QuantitySelector
 */

import { memo } from 'react';
import styles from './EditItem.module.css';

interface QuantitySelectorProps {
    /** Current quantity value */
    value: number;
    /** Callback when quantity changes */
    onChange: (quantity: number) => void;
    /** Minimum allowed quantity (default: 1) */
    min?: number;
    /** Maximum allowed quantity (default: 999) */
    max?: number;
    /** Disabled state */
    disabled?: boolean;
}

/**
 * QuantitySelector - Pure presentational component
 * 
 * Features:
 * - Increment/decrement buttons
 * - Keyboard accessible
 * - Min/max constraints
 * - Disabled state support
 * 
 * @example
 * ```tsx
 * <QuantitySelector
 *   value={quantity}
 *   onChange={setQuantity}
 *   min={1}
 *   max={10}
 * />
 * ```
 */
const QuantitySelector = memo<QuantitySelectorProps>(
    ({ value, onChange, min = 1, max = 999, disabled = false }) => {
        const canDecrease = value > min;
        const canIncrease = value < max;

        const handleDecrease = () => {
            if (canDecrease && !disabled) {
                onChange(value - 1);
            }
        };

        const handleIncrease = () => {
            if (canIncrease && !disabled) {
                onChange(value + 1);
            }
        };

        return (
            <div className={styles.selector}>
                <button
                    onClick={handleDecrease}
                    disabled={!canDecrease || disabled}
                    aria-label="Decrease quantity"
                    type="button"
                    style={{
                        cursor: canDecrease && !disabled ? 'pointer' : 'not-allowed',
                        opacity: canDecrease && !disabled ? 1 : 0.3,
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        placeItems: 'center',
                        height: '100%',
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="1"
                        viewBox="0 0 15 1"
                        fill="none"
                    >
                        <path d="M0 1V0H15V1H0Z" fill="#0E0E0E" />
                    </svg>
                </button>

                <p aria-live="polite" aria-atomic="true">
                    {value}
                </p>

                <button
                    onClick={handleIncrease}
                    disabled={!canIncrease || disabled}
                    aria-label="Increase quantity"
                    type="button"
                    style={{
                        cursor: canIncrease && !disabled ? 'pointer' : 'not-allowed',
                        opacity: canIncrease && !disabled ? 1 : 0.3,
                        background: 'none',
                        border: 'none',
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                    >
                        <path
                            d="M0 8.07692V6.92308H6.92308V0H8.07692V6.92308H15V8.07692H8.07692V15H6.92308V8.07692H0Z"
                            fill="#0E0E0E"
                        />
                    </svg>
                </button>
            </div>
        );
    }
);

QuantitySelector.displayName = 'QuantitySelector';

export default QuantitySelector;
