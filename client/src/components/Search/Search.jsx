import styles from './Search.module.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lenisInstance } from '../../App';
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
    const headerHeight = useHeaderHeight();
    const navigate = useNavigate();

    // State cho search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimerRef = useRef(null);

    useLenisControl(true);

    // ✅ Sử dụng useGSAP cho animations
    useGSAP(() => {
        const timeline = gsap.timeline();

        // Animate backdrop opacity từ 0 -> 1
        timeline.fromTo(
            backdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: 'power2.out' }
        );

        // Animate search container height từ 0 -> auto
        timeline.fromTo(
            searchContainerRef.current,
            { height: 0 },
            {
                height: 'auto',
                duration: 0.5,
                ease: 'power3.out'
            },
            '<'
        );

        timeline.fromTo(
            [inputWrapperRef.current, resultsRef.current],
            { opacity: 0 },
            {
                opacity: 1,
                duration: 0.5,
                ease: 'power3.out'
            },
            '<'
        );

        // Focus vào input sau khi animation xong
        timeline.call(() => {
            inputRef.current?.focus();
        });
    }, { scope: containerRef });

    // Search products với debounce
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
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
            try {
                const response = await getAllProducts({
                    search: searchQuery,
                    limit: 10
                });

                if (response.success && response.data) {
                    setSearchResults(response.data);
                }
            } catch (error) {
                console.error('Error searching products:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300); // Debounce 300ms

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery]);

    const handleClose = () => {
        // GSAP Animation khi đóng
        const timeline = gsap.timeline({
            onComplete: onClose
        });

        // Animate search container về height 0
        timeline.to(searchContainerRef.current, {
            height: 0,
            duration: 0.3,
            ease: 'power2.in'
        });

        // Animate backdrop về opacity 0
        timeline.to(
            backdropRef.current,
            { opacity: 0, duration: 0.3, ease: 'power2.in' },
            '<'
        );

        timeline.to(
            [inputWrapperRef.current, resultsRef.current],
            {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in'
            },
            '<'
        );
    };

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleResultClick = async (product) => {
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
    };

    return (
        <div ref={containerRef}>
            <div
                ref={backdropRef}
                className={styles.backdrop}
                onClick={handleClose}
            ></div>

            <div
                ref={searchContainerRef}
                className={styles.searchContainer}
                style={{ top: `${headerHeight}px` }}
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
                    {isSearching && (
                        <p className={styles.searchStatus}>Searching...</p>
                    )}

                    {!isSearching && searchQuery && searchResults.length === 0 && (
                        <p className={styles.searchStatus}>No products found</p>
                    )}

                    {!isSearching && searchResults.length > 0 && (
                        searchResults.map((product) => (
                            <div
                                key={product._id}
                                className={styles.result}
                                onClick={() => handleResultClick(product)}
                            >
                                {product.name}
                            </div>
                        ))
                    )}

                    {!searchQuery && (
                        <p className={styles.searchStatus}>Start typing to search products...</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Search;