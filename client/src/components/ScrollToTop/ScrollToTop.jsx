import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { lenisInstance } from '../../App';

/**
 * ScrollToTop Component
 * Automatically scrolls to top whenever route changes
 * Works for all pages in the app
 * Compatible with Lenis smooth scroll
 * Triggers on both pathname AND search params changes
 */
const ScrollToTop = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // Multiple methods to ensure scroll works

        // Method 1: Lenis scroll
        if (lenisInstance) {
            lenisInstance.scrollTo(0, { immediate: true, force: true });
        }

        // Method 2: Direct window scroll
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // Method 3: Fallback after small delay (ensures it works even if dom isn't ready)
        setTimeout(() => {
            if (lenisInstance) {
                lenisInstance.scrollTo(0, { immediate: true, force: true });
            }
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }, 0);
    }, [pathname, search]); // Listen to both pathname AND search params

    return null;
};

export default ScrollToTop;
