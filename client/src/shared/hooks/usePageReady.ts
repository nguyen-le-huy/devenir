import { useRef, RefObject } from 'react';

interface PageReadyOptions {
    isDataReady?: boolean;
}

interface PageReadyResult {
    isPageReady: boolean;
    containerRef: RefObject<HTMLElement | null>;
}

/**
 * Simple hook to track page ready state
 * Only tracks data loading - images use native lazy loading
 * 
 * @param {Object} options
 * @param {boolean} options.isDataReady - Data ready state from React Query
 * @returns {Object} { isPageReady }
 */
const usePageReady = ({
    isDataReady = true,
}: PageReadyOptions = {}): PageReadyResult => {
    // Simply return data ready state - no complex image tracking
    // Images should use loading="lazy" attribute
    return {
        isPageReady: isDataReady,
        containerRef: useRef<HTMLElement>(null),
    };
};

export default usePageReady;
