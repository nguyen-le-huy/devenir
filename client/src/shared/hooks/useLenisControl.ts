import { useEffect } from 'react';
import { lenisInstance } from '@/core/lib/lenis';

// Reference counter to track number of components requesting scroll stop
let scrollStopCount = 0;

// Prevent wheel scroll function - created once and reused
const preventScroll = (e: Event) => {
    // Cast strict type
    const wheelEvent = e as WheelEvent;

    // Allow scroll in elements with data-lenis-prevent and overflow
    const target = wheelEvent.target as HTMLElement;
    const scrollableParent = target.closest('[data-lenis-prevent]');

    if (scrollableParent) {
        const { scrollHeight, clientHeight } = scrollableParent;
        // Only allow scroll if element actually overflows
        if (scrollHeight > clientHeight) {
            return; // Allow scroll in this container
        }
    }

    e.preventDefault();
};

/**
 * Custom hook to stop Lenis scroll when component mounts,
 * and restart when unmounts.
 * Uses reference counting to handle multiple components simultaneously.
 * 
 * @param {boolean} active - Activation state (default true). If true, stops lenis.
 */
export const useLenisControl = (active: boolean = true): void => {
    useEffect(() => {
        // Only stop if active = true
        if (!active) return;

        // Increase counter
        scrollStopCount++;

        // Only stop if this is the first component requesting stop
        if (scrollStopCount === 1) {
            if (lenisInstance) {
                lenisInstance.stop();
            }
            // Block wheel event at document level
            document.addEventListener('wheel', preventScroll, { passive: false });
            document.addEventListener('touchmove', preventScroll, { passive: false });
        }

        // Cleanup function: runs when component unmounts
        return () => {
            // Decrease counter
            scrollStopCount--;

            // Only restart if no other component requests stop
            if (scrollStopCount === 0) {
                if (lenisInstance) {
                    lenisInstance.start();
                }
                document.removeEventListener('wheel', preventScroll);
                document.removeEventListener('touchmove', preventScroll);
            }
        };
    }, [active]);
};
