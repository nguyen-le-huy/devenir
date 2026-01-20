import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to track when all images in a container are fully loaded
 * @param {Object} options
 * @param {boolean} options.trackImages - Whether to track image loading, default true
 * @param {boolean} options.isDataReady - External data ready state (from React Query, etc.)
 * @returns {Object} { isPageReady, containerRef }
 */
const usePageReady = ({
    trackImages = true,
    isDataReady = true,
} = {}) => {
    const [imagesLoaded, setImagesLoaded] = useState(!trackImages);
    const containerRef = useRef(null);
    const observerRef = useRef(null);

    // Track images loading
    const checkAllImagesLoaded = useCallback(() => {
        if (!containerRef.current || !trackImages) return;

        const images = containerRef.current.querySelectorAll('img');
        if (images.length === 0) {
            setImagesLoaded(true);
            return;
        }

        const allLoaded = Array.from(images).every((img) => img.complete && img.naturalHeight !== 0);
        
        if (allLoaded) {
            setImagesLoaded(true);
        }
    }, [trackImages]);

    useEffect(() => {
        if (!trackImages || !containerRef.current) {
            setImagesLoaded(true);
            return;
        }

        const container = containerRef.current;
        const images = container.querySelectorAll('img');

        if (images.length === 0) {
            setImagesLoaded(true);
            return;
        }

        let loadedCount = 0;
        const totalImages = images.length;

        const handleImageLoad = () => {
            loadedCount++;
            if (loadedCount >= totalImages) {
                setImagesLoaded(true);
            }
        };

        const handleImageError = () => {
            loadedCount++;
            if (loadedCount >= totalImages) {
                setImagesLoaded(true);
            }
        };

        // Check already loaded images
        images.forEach((img) => {
            if (img.complete) {
                loadedCount++;
            } else {
                img.addEventListener('load', handleImageLoad);
                img.addEventListener('error', handleImageError);
            }
        });

        if (loadedCount >= totalImages) {
            setImagesLoaded(true);
        }

        // Use MutationObserver to detect dynamically added images
        observerRef.current = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'IMG') {
                        if (!node.complete) {
                            node.addEventListener('load', checkAllImagesLoaded);
                            node.addEventListener('error', checkAllImagesLoaded);
                        }
                    }
                    if (node.querySelectorAll) {
                        const newImages = node.querySelectorAll('img');
                        newImages.forEach((img) => {
                            if (!img.complete) {
                                img.addEventListener('load', checkAllImagesLoaded);
                                img.addEventListener('error', checkAllImagesLoaded);
                            }
                        });
                    }
                });
            });
        });

        observerRef.current.observe(container, {
            childList: true,
            subtree: true,
        });

        return () => {
            images.forEach((img) => {
                img.removeEventListener('load', handleImageLoad);
                img.removeEventListener('error', handleImageError);
            });
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [trackImages, checkAllImagesLoaded]);

    // Reset when data changes
    useEffect(() => {
        if (!isDataReady) {
            setImagesLoaded(false);
        }
    }, [isDataReady]);

    const isPageReady = isDataReady && imagesLoaded;

    return {
        isPageReady,
        containerRef,
        imagesLoaded,
    };
};

export default usePageReady;
