import { useEffect } from 'react';

/**
 * Custom hook to lock scroll by setting body position = fixed
 * This approach is stronger than overflow: hidden and works with all scroll libraries
 * 
 * @param {boolean} isLocked - If true, locks scroll
 */
export const useScrollLock = (isLocked: boolean = false): void => {
    useEffect(() => {
        if (!isLocked) return;

        // Save current scroll position
        const scrollY = window.scrollY;

        // Lock scroll by fixing body position
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Cleanup function: runs when component unmounts or isLocked = false
        return () => {
            // Unlock scroll
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            // Restore scroll position
            window.scrollTo(0, scrollY);
        };
    }, [isLocked]);
};
