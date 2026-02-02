import { memo, useMemo, CSSProperties } from 'react';
import styles from './Backdrop.module.css';

interface BackdropProps {
    onClick?: () => void;
    visible?: boolean;
    isOpen?: boolean;
    zIndex?: number;
    opacity?: number;
    className?: string;
    preventLenis?: boolean;
    style?: CSSProperties;
}

/**
 * Reusable Backdrop Component
 */
const Backdrop = memo(({
    onClick,
    visible = true,
    isOpen,
    zIndex = 1001,
    opacity = 0.5,
    className = '',
    preventLenis = true,
    style = {},
}: BackdropProps) => {
    // Hooks must be called at the top level
    const backdropStyle = useMemo<CSSProperties>(() => ({
        '--backdrop-z-index': zIndex,
        '--backdrop-opacity': opacity,
        ...style,
    }), [zIndex, opacity, style]);

    // If using isOpen pattern (no animation needed), render conditionally
    if (isOpen !== undefined && !isOpen) {
        return null;
    }

    return (
        <div
            className={`${styles.backdrop} ${visible ? styles.visible : ''} ${className}`}
            onClick={onClick}
            style={backdropStyle}
            {...(preventLenis ? { 'data-lenis-prevent': true } : {})}
        />
    );
});

Backdrop.displayName = 'Backdrop';

export default Backdrop;
