import { memo, ReactNode } from 'react';
import Loading from '../Loading/Loading';
import styles from './PageWrapper.module.css';

interface PageWrapperProps {
    children: ReactNode;
    isLoading?: boolean;
    isDataLoading?: boolean; // Legacy prop support, can be removed if not used
    loaderSize?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * PageWrapper Component - Enterprise-grade page wrapper
 * 
 * Follows industry standard patterns:
 * - Shows loader ONLY during initial data fetch
 * - Content appears immediately once data is ready
 * - Images lazy load naturally (no blocking)
 * - Cached data = instant display (no loader flicker)
 */
const PageWrapper = memo(({
    children,
    isLoading = false,
    isDataLoading, // Legacy prop support
    loaderSize = 'lg',
    className = '',
}: PageWrapperProps) => {
    // Support both isLoading (new) and isDataLoading (legacy)
    const showLoader = isLoading || isDataLoading;

    // If not loading, show content immediately
    if (!showLoader) {
        return (
            <div className={className}>
                {children}
            </div>
        );
    }

    // Only show loader during actual data loading
    return (
        <div className={styles.loaderOverlay}>
            <Loading size={loaderSize} />
        </div>
    );
});

PageWrapper.displayName = 'PageWrapper';

export default PageWrapper;
