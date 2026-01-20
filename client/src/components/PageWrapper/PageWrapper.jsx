import { memo } from 'react';
import usePageReady from '../../hooks/usePageReady';
import Loading from '../Loading/Loading';
import styles from './PageWrapper.module.css';
import PropTypes from 'prop-types';

/**
 * PageWrapper Component
 * Wraps page content and shows a loader until all images and data are ready
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.isDataLoading - Whether data is still loading (from React Query)
 * @param {boolean} props.isReady - External ready state (overrides internal tracking if provided)
 * @param {boolean} props.trackImages - Whether to track image loading, default true
 * @param {string} props.loaderSize - Loader size: 'sm', 'md', 'lg', default 'lg'
 * @param {string} props.className - Additional className for the content wrapper
 */
const PageWrapper = memo(({
    children,
    isDataLoading = false,
    isReady: externalIsReady,
    trackImages = true,
    loaderSize = 'lg',
    className = '',
}) => {
    const { isPageReady: internalIsReady, containerRef } = usePageReady({
        trackImages,
        isDataReady: !isDataLoading,
    });

    // If external isReady is provided, use it; otherwise use internal tracking
    const isPageReady = externalIsReady !== undefined ? externalIsReady : internalIsReady;

    return (
        <>
            {/* Loader overlay */}
            <div 
                className={`${styles.loaderOverlay} ${isPageReady ? styles.hidden : ''}`}
                aria-hidden={isPageReady}
            >
                <Loading size={loaderSize} />
            </div>

            {/* Page content - always rendered but hidden until ready */}
            <div 
                ref={containerRef}
                className={`${styles.pageContent} ${isPageReady ? styles.visible : styles.loading} ${className}`}
            >
                {children}
            </div>
        </>
    );
});

PageWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    isDataLoading: PropTypes.bool,
    isReady: PropTypes.bool,
    trackImages: PropTypes.bool,
    loaderSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
};

PageWrapper.displayName = 'PageWrapper';

export default PageWrapper;
