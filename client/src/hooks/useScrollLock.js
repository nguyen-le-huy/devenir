import { useEffect } from 'react';

/**
 * Custom hook để lock scroll bằng cách set body position = fixed
 * Approach này mạnh hơn overflow: hidden và hoạt động với mọi scroll library
 * 
 * @param {boolean} isLocked - Nếu true, sẽ lock scroll
 */
export const useScrollLock = (isLocked = false) => {
    useEffect(() => {
        if (!isLocked) return;

        // Lưu scroll position hiện tại
        const scrollY = window.scrollY;

        // Lock scroll bằng cách fix body position
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Cleanup function: chạy khi component unmount hoặc isLocked = false
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
