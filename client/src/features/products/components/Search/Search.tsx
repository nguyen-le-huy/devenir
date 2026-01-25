import styles from './Search.module.css';
import { useEffect, useRef, useState, useCallback, useMemo, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useHeaderHeight } from '@/shared/hooks/useHeaderHeight';
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { getAllProducts, getProductVariants } from '@/features/products/api/productService';
import VisualSearch from '../VisualSearch/VisualSearch';
import { trackEvent } from '@/shared/utils/eventTracker';

interface SearchProps {
    onClose: () => void;
}

const Search = ({ onClose }: SearchProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const abortControllerRef = useRef<AbortController | null>(null);
    const headerHeight = useHeaderHeight();

    // State cho search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Only lock scroll when Search is active (not VisualSearch)
    useLenisControl(!isVisualSearchOpen);

    // ✅ Sử dụng useGSAP cho animations với proper cleanup
    useGSAP(() => {
        const timeline = gsap.timeline();

        // Animate backdrop opacity từ 0 -> 1
        timeline.fromTo(
            backdropRef.current,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
                onComplete: () => {
                    // Enable pointer events after animation
                    if (backdropRef.current) {
                        backdropRef.current.style.pointerEvents = 'auto';
                    }
                }
            }
        );

        // Animate search container với clipPath để tránh scrollbar flash
        timeline.fromTo(
            searchContainerRef.current,
            {
                clipPath: 'inset(0 0 100% 0)',
                opacity: 0
            },
            {
                clipPath: 'inset(0 0 0% 0)',
                opacity: 1,
                duration: 0.4,
                ease: 'power3.out'
            },
            '<'
        );

        timeline.fromTo(
            [inputWrapperRef.current, resultsRef.current],
            { opacity: 0, y: -10 },
            {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            },
            '-=0.2'
        );

        // Focus vào input sau khi animation xong
        timeline.call(() => {
            inputRef.current?.focus();
        });

        // Cleanup
        return () => {
            timeline.kill();
        };
    }, { scope: containerRef });

    // Search products với debounce và abort controller
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Nếu search query rỗng, clear results
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        // Set debounce timer
        setIsSearching(true);
        debounceTimerRef.current = setTimeout(async () => {
            // Create new abort controller
            abortControllerRef.current = new AbortController();

            try {
                const response: any = await getAllProducts({
                    search: searchQuery,
                    limit: 10
                });

                if (response.success && response.data) {
                    setSearchResults(response.data);

                    // Track search event
                    trackEvent.search(searchQuery, response.data.length, {});
                }
            } catch (error: any) {
                // Ignore abort errors
                if (error.name !== 'AbortError') {
                    console.error('Error searching products:', error);
                    setSearchResults([]);
                }
            } finally {
                setIsSearching(false);
            }
        }, 300); // Debounce 300ms

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [searchQuery]);

    const handleClose = useCallback(() => {
        // Disable backdrop interactions immediately
        if (backdropRef.current) {
            backdropRef.current.style.pointerEvents = 'none';
        }

        // GSAP Animation khi đóng
        const timeline = gsap.timeline({
            onComplete: onClose
        });

        // Animate content ra trước
        timeline.to(
            [inputWrapperRef.current, resultsRef.current],
            {
                opacity: 0,
                y: -10,
                duration: 0.2,
                ease: 'power2.in'
            }
        );

        // Animate search container với clipPath
        timeline.to(searchContainerRef.current, {
            clipPath: 'inset(0 0 100% 0)',
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in'
        }, '-=0.1');

        // Animate backdrop về opacity 0
        timeline.to(
            backdropRef.current,
            { opacity: 0, duration: 0.25, ease: 'power2.in' },
            '<'
        );
    }, [onClose]);

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    // Handle Visual Search icon click
    const handleVisualSearchClick = useCallback(() => {
        setIsVisualSearchOpen(true);
    }, []);

    // Handle Visual Search close - close entire Search component
    const handleVisualSearchClose = useCallback(() => {
        setIsVisualSearchOpen(false);
        handleClose(); // Close Search as well
    }, [handleClose]);

    const handleResultClick = useCallback(async (product: any) => {
        try {
            // Lấy variants của product này
            const variantsData: any = await getProductVariants(product._id);

            if (variantsData.success && variantsData.data && variantsData.data.length > 0) {
                // Navigate đến variant đầu tiên của product
                const firstVariantId = variantsData.data[0]._id;
                navigate(`/product-detail?variant=${firstVariantId}`);
            } else {
                // Nếu không có variant, hiển thị thông báo lỗi
                console.error('No variants found for this product');
                alert('This product has no variants available.');
            }

            // Đóng search modal
            handleClose();
        } catch (error) {
            console.error('Error navigating to product:', error);
            alert('An error occurred while loading the product.');
            handleClose();
        }
    }, [navigate, handleClose]);

    // Memoize search results rendering để tránh re-render không cần thiết
    const renderedResults = useMemo(() => {
        if (isSearching) {
            return <p className={styles.searchStatus}>Searching...</p>;
        }

        if (!searchQuery) {
            return <p className={styles.searchStatus}>Start typing to search products...</p>;
        }

        if (searchResults.length === 0) {
            return <p className={styles.searchStatus}>No products found</p>;
        }

        return searchResults.map((product) => (
            <div
                key={product._id}
                className={styles.result}
                onClick={() => handleResultClick(product)}
            >
                {product.name}
            </div>
        ));
    }, [searchResults, isSearching, searchQuery, handleResultClick]);

    return (
        <>
            {/* Visual Search Modal */}
            <VisualSearch
                isOpen={isVisualSearchOpen}
                onClose={handleVisualSearchClose}
            />

            {/* Search - hide when VisualSearch is open */}
            {!isVisualSearchOpen && (
                <div ref={containerRef} data-lenis-prevent>
                    <div
                        ref={backdropRef}
                        className={styles.backdrop}
                        style={{ top: `${headerHeight}px` }}
                        onClick={handleClose}
                    ></div>

                    <div
                        ref={searchContainerRef}
                        className={styles.searchContainer}
                        style={{ top: `${headerHeight}px` }}
                        data-lenis-prevent
                    >
                        <div className={styles.inputWrapper} ref={inputWrapperRef}>
                            <input
                                type="text"
                                placeholder="Search"
                                ref={inputRef}
                                value={searchQuery}
                                onChange={handleInputChange}
                            />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 22 22"
                                fill="none"
                                className={styles.visualSearchIcon}
                                onClick={handleVisualSearchClick}
                            >
                                <path d="M1 6V3.5C1 2.83696 1.26339 2.20107 1.73223 1.73223C2.20107 1.26339 2.83696 1 3.5 1H6M1 16V18.5C1 19.163 1.26339 19.7989 1.73223 20.2678C2.20107 20.7366 2.83696 21 3.5 21H6M16 1H18.5C19.163 1 19.7989 1.26339 20.2678 1.73223C20.7366 2.20107 21 2.83696 21 3.5V6M16 21H18.5C19.163 21 19.7989 20.7366 20.2678 20.2678C20.7366 19.7989 21 19.163 21 18.5V16M7.25 11C7.25 11.9946 7.64509 12.9484 8.34835 13.6517C9.05161 14.3549 10.0054 14.75 11 14.75C11.9946 14.75 12.9484 14.3549 13.6517 13.6517C14.3549 12.9484 14.75 11.9946 14.75 11C14.75 10.0054 14.3549 9.05161 13.6517 8.34835C12.9484 7.64509 11.9946 7.25 11 7.25C10.0054 7.25 9.05161 7.64509 8.34835 8.34835C7.64509 9.05161 7.25 10.0054 7.25 11Z" stroke="#0E0E0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className={styles.results} ref={resultsRef}>
                            {renderedResults}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Search;
