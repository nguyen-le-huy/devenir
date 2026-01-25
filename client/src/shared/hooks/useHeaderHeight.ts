import { useState, useEffect } from 'react';

export const useHeaderHeight = (): number => {
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    useEffect(() => {
        let throttleTimer: ReturnType<typeof setTimeout> | null = null;

        const updateHeaderHeight = () => {
            // Query all possible header matches and find the truly sticky one
            const headers = document.querySelectorAll<HTMLElement>('[class*="header"]');
            let stickyHeader: HTMLElement | null = null;

            headers.forEach(header => {
                const styles = window.getComputedStyle(header);
                // Find the one with position: sticky AND a top value set (not 'auto')
                // This ensures we get the main header, not topBar
                if (styles.position === 'sticky' && styles.top !== 'auto' && styles.top === '0px') {
                    stickyHeader = header;
                }
            });

            if (stickyHeader) {
                const rect = (stickyHeader as HTMLElement).getBoundingClientRect();
                // rect.bottom gives us the bottom edge position from viewport top
                // When header is sticky at top:0, this is effectively the header height
                // But when topBar is visible, we need to account for it
                setHeaderHeight(rect.bottom);
            }
        };

        // Throttled scroll handler for performance
        const handleScroll = () => {
            if (throttleTimer) return;

            throttleTimer = setTimeout(() => {
                updateHeaderHeight();
                throttleTimer = null;
            }, 16); // ~60fps
        };

        // Initial measurement
        updateHeaderHeight();

        // Listen to BOTH resize AND scroll
        // Scroll is needed because topBar can scroll out of view
        window.addEventListener('resize', updateHeaderHeight);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            window.removeEventListener('scroll', handleScroll);
            if (throttleTimer) {
                clearTimeout(throttleTimer);
            }
        };
    }, []);

    return headerHeight;
};
