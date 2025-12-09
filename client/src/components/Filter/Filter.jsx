import { useEffect, useRef, useState } from 'react';
import styles from './Filter.module.css';
import { useLenisControl } from '../../hooks/useLenisControl';
import { lenisInstance } from '../../App';

const Filter = ({
    isOpen,
    onClose,
    availableColors = [],
    colorMap = {}, // Color hex codes từ DB
    colorCounts = {}, // Number of products per color
    selectedSort,
    setSelectedSort,
    selectedColors,
    setSelectedColors,
    totalResults = 0
}) => {
    const overlayRef = useRef(null);
    const [isSortByOpen, setIsSortByOpen] = useState(false);
    const [isColourOpen, setIsColourOpen] = useState(false);

    const sortOptions = ['Default', 'Price High', 'Price Low', 'New In'];

    // Generate color options từ availableColors + colorMap từ DB
    const colourOptions = availableColors.map(colorName => ({
        name: colorName,
        code: colorMap[colorName] || '#CCCCCC', // Lấy hex từ DB hoặc default
        count: colorCounts[colorName] || 0, // Số lượng sản phẩm
    }));

    // Handle click outside to close filter
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.classList.contains(styles.backdrop)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Handle Escape key to close filter
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);


    // Lock scroll when modal is open using useLenisControl instead of useScrollLock
    useLenisControl(isOpen);

    // Toggle Sort By dropdown (close Colour dropdown if open)
    const handleToggleSortBy = () => {
        setIsSortByOpen(!isSortByOpen);
        if (!isSortByOpen) {
            setIsColourOpen(false);
        }
    };

    // Toggle Colour dropdown (close Sort By dropdown if open)
    const handleToggleColourDropdown = () => {
        setIsColourOpen(!isColourOpen);
        if (!isColourOpen) {
            setIsSortByOpen(false);
        }
    };

    // Handle sort option selection
    const handleSelectSort = (option) => {
        setSelectedSort(option);
        // Scroll to top để xem kết quả filter
        scrollToTop();
    };

    // Handle colour selection (multi-select)
    const handleSelectColour = (colourName) => {
        setSelectedColors(prev => {
            if (prev.includes(colourName)) {
                return prev.filter(c => c !== colourName);
            } else {
                return [...prev, colourName];
            }
        });
        // Scroll to top để xem kết quả filter
        scrollToTop();
    };

    // Handle clear all filters
    const handleClearAll = () => {
        setSelectedSort('Default');
        setSelectedColors([]);
        // Scroll to top khi clear
        scrollToTop();
    };

    // Scroll to top helper
    const scrollToTop = () => {
        // Use Lenis if available, otherwise fallback to window.scrollTo
        if (lenisInstance) {
            lenisInstance.scrollTo(0, { immediate: true, force: true });
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // Fallback after small delay
        setTimeout(() => {
            if (lenisInstance) {
                lenisInstance.scrollTo(0, { immediate: true, force: true });
            }
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }, 0);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Dark Overlay */}
            <div className={styles.backdrop} onClick={onClose} data-lenis-prevent></div>

            {/* Filter Panel */}
            <div ref={overlayRef} className={`${styles.overlayFilter} ${isOpen ? styles.show : ''} `} data-lenis-prevent>
                <div className={styles.box}>
                    <div className={styles.header}>
                        <span>Filter & Sort</span>
                        <svg
                            onClick={onClose}
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 13 13"
                            fill="none"
                        >
                            <path d="M6.36875 7.10625L0.904167 12.5708C0.806944 12.6681 0.6875 12.7201 0.545833 12.7271C0.404166 12.734 0.277778 12.6819 0.166667 12.5708C0.0555554 12.4597 0 12.3368 0 12.2021C0 12.0674 0.0555554 11.9444 0.166667 11.8333L5.63125 6.36875L0.166667 0.904167C0.0694443 0.806944 0.0173609 0.6875 0.0104164 0.545833C0.00347196 0.404166 0.0555554 0.277778 0.166667 0.166667C0.277778 0.0555554 0.400694 0 0.535417 0C0.670139 0 0.793056 0.0555554 0.904167 0.166667L6.36875 5.63125L11.8333 0.166667C11.9306 0.0694443 12.0503 0.0173609 12.1927 0.0104164C12.3337 0.00347196 12.4597 0.0555554 12.5708 0.166667C12.6819 0.277778 12.7375 0.400694 12.7375 0.535417C12.7375 0.670139 12.6819 0.793056 12.5708 0.904167L7.10625 6.36875L12.5708 11.8333C12.6681 11.9306 12.7201 12.0503 12.7271 12.1927C12.734 12.3337 12.6819 12.4597 12.5708 12.5708C12.4597 12.6819 12.3368 12.7375 12.2021 12.7375C12.0674 12.7375 11.9444 12.6819 11.8333 12.5708L6.36875 7.10625Z" fill="#0E0E0E" />
                        </svg>
                    </div>
                    <div className={styles.selectors}>
                        {/* Sort By Section */}
                        <div className={styles.sortBy}>
                            <div className={styles.sortByLabel} onClick={handleToggleSortBy}>
                                <p>Sort By</p>
                                <svg
                                    className={isSortByOpen ? styles.rotated : ''}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                >
                                    <path d="M7.29493 7.2954L7.29494 13.3626C7.29493 13.4705 7.25754 13.5658 7.18275 13.6483C7.10796 13.7308 7.00888 13.772 6.88552 13.772C6.76216 13.772 6.66308 13.7346 6.58829 13.6598C6.5135 13.585 6.47611 13.486 6.47611 13.3626L6.47611 7.2954L0.408913 7.2954C0.30097 7.2954 0.205748 7.25801 0.123248 7.18322C0.0407485 7.10843 -0.000501121 7.00935 -0.000501119 6.88599C-0.000501121 6.76262 0.0368937 6.66355 0.111683 6.58876C0.186473 6.51397 0.285549 6.47657 0.408913 6.47657L6.47611 6.47657L6.47611 0.409378C6.47611 0.301435 6.51369 0.206021 6.58887 0.123135C6.66327 0.0410214 6.76216 -3.55985e-05 6.88552 -3.57013e-05C7.00888 -3.51323e-05 7.10796 0.0373592 7.18275 0.112149C7.25754 0.186938 7.29493 0.286015 7.29494 0.409379L7.29493 6.47657L13.3621 6.47657C13.4701 6.47657 13.5655 6.51416 13.6484 6.58933C13.7305 6.66374 13.7715 6.76262 13.7715 6.88599C13.7715 7.00935 13.7341 7.10843 13.6594 7.18322C13.5846 7.25801 13.4855 7.2954 13.3621 7.2954L7.29493 7.2954Z" fill="#0E0E0E" />
                                </svg>
                            </div>

                            {/* Dropdown with Radio Buttons */}
                            {isSortByOpen && (
                                <div className={styles.dropdown}>
                                    {sortOptions.map((option) => (
                                        <label
                                            key={option}
                                            className={styles.radioOption}
                                        >
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                value={option}
                                                checked={selectedSort === option}
                                                onChange={() => handleSelectSort(option)}
                                                className={styles.radioInput}
                                            />
                                            <span className={styles.radioLabel}>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Colour Section */}
                        <div className={styles.colour}>
                            <div className={styles.colourLabel} onClick={handleToggleColourDropdown}>
                                <p>Colour</p>
                                <svg
                                    className={isColourOpen ? styles.rotated : ''}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                >
                                    <path d="M7.29493 7.2954L7.29494 13.3626C7.29493 13.4705 7.25754 13.5658 7.18275 13.6483C7.10796 13.7308 7.00888 13.772 6.88552 13.772C6.76216 13.772 6.66308 13.7346 6.58829 13.6598C6.5135 13.585 6.47611 13.486 6.47611 13.3626L6.47611 7.2954L0.408913 7.2954C0.30097 7.2954 0.205748 7.25801 0.123248 7.18322C0.0407485 7.10843 -0.000501121 7.00935 -0.000501119 6.88599C-0.000501121 6.76262 0.0368937 6.66355 0.111683 6.58876C0.186473 6.51397 0.285549 6.47657 0.408913 6.47657L6.47611 6.47657L6.47611 0.409378C6.47611 0.301435 6.51369 0.206021 6.58887 0.123135C6.66327 0.0410214 6.76216 -3.55985e-05 6.88552 -3.57013e-05C7.00888 -3.51323e-05 7.10796 0.0373592 7.18275 0.112149C7.25754 0.186938 7.29493 0.286015 7.29494 0.409379L7.29493 6.47657L13.3621 6.47657C13.4701 6.47657 13.5655 6.51416 13.6484 6.58933C13.7305 6.66374 13.7715 6.76262 13.7715 6.88599C13.7715 7.00935 13.7341 7.10843 13.6594 7.18322C13.5846 7.25801 13.4855 7.2954 13.3621 7.2954L7.29493 7.2954Z" fill="#0E0E0E" />
                                </svg>
                            </div>

                            {/* Colour Swatches Dropdown */}
                            {isColourOpen && (
                                <div className={styles.colourDropdown}>
                                    <div className={styles.colourGrid}>
                                        {colourOptions.map((colour) => (
                                            <label
                                                key={colour.name}
                                                className={styles.colourOption}
                                                onClick={() => handleSelectColour(colour.name)}
                                            >
                                                <div className={styles.colourSwatchWrapper}>
                                                    <div
                                                        className={`${styles.colourSwatch} ${colour.name === 'White' ? styles.whiteSwatch : ''} `}
                                                        style={{
                                                            background: colour.code.includes('gradient')
                                                                ? colour.code
                                                                : colour.code
                                                        }}
                                                    />
                                                </div>
                                                <div className={styles.colourInfo}>
                                                    <span className={styles.colourName}>{colour.name}</span>
                                                    <span className={styles.colourCount}>
                                                        {colour.count}
                                                        {selectedColors.includes(colour.name) && ' ✓'}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.buttonList}>
                    <span className={styles.clearAll} onClick={handleClearAll}>Clear All</span>
                    <button className={styles.showButton} onClick={onClose}>
                        Show {totalResults} results
                    </button>
                </div>
            </div>
        </>
    );
};

export default Filter;