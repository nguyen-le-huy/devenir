import { useState, useEffect } from 'react';

/**
 * useImagePreloader Hook
 * 
 * Preloads a list of critical images and returns a true/false state.
 * Useful for ensuring "above-the-fold" content is visually ready before dismissing a loader.
 * 
 * @param imageUrls Array of image URLs to preload
 * @param isEnabled Condition to start preloading (e.g., when data is fetched)
 * @returns {boolean} areImagesLoaded - True when all images are loaded (or failed gracefully)
 */
export const useImagePreloader = (imageUrls: string[], isEnabled: boolean = true): boolean => {
    const [areImagesLoaded, setAreImagesLoaded] = useState(false);

    useEffect(() => {
        // If disabled or empty list, consider "loaded" immediately
        if (!isEnabled || imageUrls.length === 0) {
            setAreImagesLoaded(true);
            return;
        }

        let isMounted = true;
        setAreImagesLoaded(false);

        const preloadImage = (src: string): Promise<void> => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Validate fail-safe: don't block UI on error
            });
        };

        const preloadAll = async () => {
            await Promise.allSettled(imageUrls.map(preloadImage));
            if (isMounted) {
                setAreImagesLoaded(true);
            }
        };

        preloadAll();

        return () => {
            isMounted = false;
        };
    }, [imageUrls, isEnabled]); // Reset when URLs change or enabled state toggles

    return areImagesLoaded;
};
