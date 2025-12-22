import { useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ColourVarients.module.css';
import ScarfCard from '../ProductCard/ScarfCard';
import { useLenisControl } from '../../hooks/useLenisControl';
import Backdrop from '../Backdrop';
import { getOptimizedImageUrl } from '../../utils/imageOptimization';

const ColourVarients = memo(({ isOpen, onClose, siblingVariants = [], currentVariantId, colorMap = {} }) => {
    const navigate = useNavigate();

    // Lock scroll when modal is open using useLenisControl instead of useScrollLock
    useLenisControl(isOpen);

    // Get unique variants by color (one variant per color)
    const uniqueColorVariants = useMemo(() => {
        const colorVariantMap = new Map();

        siblingVariants.forEach(variant => {
            if (variant.color && !colorVariantMap.has(variant.color)) {
                colorVariantMap.set(variant.color, variant);
            }
        });

        const variants = Array.from(colorVariantMap.values());

        // Sort to put current variant first
        return variants.sort((a, b) => {
            if (a._id === currentVariantId) return -1;
            if (b._id === currentVariantId) return 1;
            return 0;
        });
    }, [siblingVariants, currentVariantId]);

    const handleVariantClick = useCallback((variantId) => {
        navigate(`/product-detail?variant=${variantId}`);
        onClose();
    }, [navigate, onClose]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.classList.contains(styles.backdrop)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Handle Escape key to close
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <>
            <Backdrop isOpen={isOpen} onClick={onClose} />
            <div className={styles.colourVarients} data-lenis-prevent>
                <div className={styles.header}>
                    <p>{uniqueColorVariants.length} {uniqueColorVariants.length === 1 ? 'Colour' : 'Colours'}</p>
                    <svg
                        onClick={onClose}
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        style={{ cursor: 'pointer' }}
                    >
                        <path d="M7.5 8.3685L1.06477 14.8037C0.950278 14.9182 0.809617 14.9796 0.642787 14.9877C0.475956 14.9959 0.327118 14.9346 0.196271 14.8037C0.0654234 14.6729 0 14.5281 0 14.3695C0 14.2108 0.0654234 14.0661 0.196271 13.9352L6.6315 7.5L0.196271 1.06477C0.0817793 0.950278 0.0204446 0.809617 0.0122666 0.642787C0.00408867 0.475956 0.0654234 0.327118 0.196271 0.196271C0.327118 0.0654234 0.471868 0 0.63052 0C0.789172 0 0.933922 0.0654234 1.06477 0.196271L7.5 6.6315L13.9352 0.196271C14.0497 0.0817793 14.1908 0.0204446 14.3584 0.0122666C14.5245 0.00408867 14.6729 0.0654234 14.8037 0.196271C14.9346 0.327118 15 0.471868 15 0.63052C15 0.789172 14.9346 0.933922 14.8037 1.06477L8.3685 7.5L14.8037 13.9352C14.9182 14.0497 14.9796 14.1908 14.9877 14.3584C14.9959 14.5245 14.9346 14.6729 14.8037 14.8037C14.6729 14.9346 14.5281 15 14.3695 15C14.2108 15 14.0661 14.9346 13.9352 14.8037L7.5 8.3685Z" fill="#041E3A" />
                    </svg>
                </div>
                <div className={styles.productVarients} data-lenis-prevent>
                    {uniqueColorVariants.map((variant) => {
                        const isActive = variant._id === currentVariantId;

                        return (
                            <div
                                key={variant._id}
                                className={styles.card}
                                onClick={() => handleVariantClick(variant._id)}
                            >
                                <img
                                    src={getOptimizedImageUrl(variant.mainImage || '/images/scarf/scarf1.png')}
                                    alt={variant.color}
                                    loading="lazy"
                                />
                                <div className={styles.info}>
                                    <p className={`${styles.colour} ${isActive ? styles.active : ''}`}>
                                        {variant.color}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
});

ColourVarients.displayName = 'ColourVarients';
export default ColourVarients;
