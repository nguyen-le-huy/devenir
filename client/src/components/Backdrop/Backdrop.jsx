import styles from './Backdrop.module.css';

/**
 * Reusable Backdrop Component
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Click handler to close modal/overlay
 * @param {boolean} props.visible - Controls visibility state (for animated transitions)
 * @param {boolean} props.isOpen - Alternative to visible - immediately shows/hides
 * @param {number} props.zIndex - Custom z-index (default: 1001)
 * @param {number} props.opacity - Background opacity 0-1 (default: 0.5)
 * @param {string} props.className - Additional CSS class
 * @param {boolean} props.preventLenis - Add data-lenis-prevent to prevent scroll
 * @param {React.CSSProperties} props.style - Inline styles
 */
const Backdrop = ({
    onClick,
    visible = true,
    isOpen,
    zIndex = 1001,
    opacity = 0.5,
    className = '',
    preventLenis = true,
    style = {},
}) => {
    // If using isOpen pattern (no animation needed), render conditionally
    if (isOpen !== undefined && !isOpen) {
        return null;
    }

    const backdropStyle = {
        '--backdrop-z-index': zIndex,
        '--backdrop-opacity': opacity,
        ...style,
    };

    return (
        <div
            className={`${styles.backdrop} ${visible ? styles.visible : ''} ${className}`}
            onClick={onClick}
            style={backdropStyle}
            {...(preventLenis && { 'data-lenis-prevent': true })}
        />
    );
};

export default Backdrop;
