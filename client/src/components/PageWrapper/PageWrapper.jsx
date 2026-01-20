import { memo } from 'react';
import Loading from '../Loading/Loading';
import styles from './PageWrapper.module.css';
import PropTypes from 'prop-types';

/**
 * PageWrapper Component - Enterprise-grade page wrapper
 * 
 * Follows industry standard patterns:
 * - Shows loader ONLY during initial data fetch
 * - Content appears immediately once data is ready
 * - Images lazy load naturally (no blocking)
 * - Cached data = instant display (no loader flicker)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.isLoading - Whether data is loading (from React Query)
 * @param {string} props.loaderSize - Loader size: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional className
 */
const PageWrapper = memo(({
    children,
    isLoading = false,
    isDataLoading, // Legacy prop support
    loaderSize = 'lg',
    className = '',
}) => {
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

PageWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    isLoading: PropTypes.bool,
    isDataLoading: PropTypes.bool,
    loaderSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
};

PageWrapper.displayName = 'PageWrapper';

export default PageWrapper;
