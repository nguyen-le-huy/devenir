import styles from './Search.module.css';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import { useLenisControl } from '../../hooks/useLenisControl';
import { getAllProducts, getProductVariants } from '../../services/productService';

const Search = ({ onClose }) => {
    const inputRef = useRef(null);
    const backdropRef = useRef(null);
    const searchContainerRef = useRef(null);
    const containerRef = useRef(null);
    const inputWrapperRef = useRef(null);
    const resultsRef = useRef(null);
    const navigate = useNavigate();
    const abortControllerRef = useRef(null);
    const headerHeight = useHeaderHeight();

    // State cho search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimerRef = useRef(null);

    useLenisControl(true);

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
                const response = await getAllProducts({
                    search: searchQuery,
                    limit: 10
                });

                if (response.success && response.data) {
                    setSearchResults(response.data);
                }
            } catch (error) {
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

    const handleInputChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    const handleResultClick = useCallback(async (product) => {
        try {
            // Lấy variants của product này
            const variantsData = await getProductVariants(product._id);

            console.log('Product clicked:', product);
            console.log('Variants data:', variantsData);

            if (variantsData.success && variantsData.data && variantsData.data.length > 0) {
                // Navigate đến variant đầu tiên của product
                const firstVariantId = variantsData.data[0]._id;
                console.log('Navigating to variant:', firstVariantId);
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 22" fill="none">
                        <path d="M22.619 1.19043L32.1428 10.719L22.619 20.2452M1.19043 10.7214H32.1428" stroke="#0E0E0E" strokeWidth="2.38095" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className={styles.results} ref={resultsRef}>
                    {renderedResults}
                </div>
            </div>
        </div>
    );
}

export default Search;