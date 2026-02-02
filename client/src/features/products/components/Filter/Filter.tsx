import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import styles from './Filter.module.css';
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { lenisInstance } from '@/core/lib/lenis';
import Backdrop from '@/shared/components/Backdrop/Backdrop';
import { trackEvent } from '@/shared/utils/eventTracker';
import { ChevronIcon } from '@/shared/components/icons/ChevronIcon';
import { CloseIcon } from '@/shared/components/icons/CloseIcon';

interface FilterProps {
    isOpen: boolean;
    onClose: () => void;
    availableColors?: string[];
    colorMap?: Record<string, string>;
    colorCounts?: Record<string, number>;
    selectedSort: string;
    setSelectedSort: (sort: string) => void;
    selectedColors: string[];
    setSelectedColors: (colors: string[]) => void;
    totalResults?: number;
}

const Filter = memo(({
    isOpen,
    onClose,
    availableColors = [],
    colorMap = {}, // Color hex codes form DB
    colorCounts = {}, // Number of products per color
    selectedSort,
    setSelectedSort,
    selectedColors,
    setSelectedColors,
    totalResults = 0
}: FilterProps) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isSortByOpen, setIsSortByOpen] = useState(false);
    const [isColourOpen, setIsColourOpen] = useState(false);

    // Memoize sort options since they're static
    const sortOptions = useMemo(() => ['Default', 'Price High', 'Price Low', 'New In'], []);

    // Memoize color options to prevent recalculation on every render
    const colourOptions = useMemo(() => availableColors.map(colorName => ({
        name: colorName,
        code: colorMap[colorName] || '#CCCCCC', // Get hex from DB or default
        count: colorCounts[colorName] || 0, // Quantity
    })), [availableColors, colorMap, colorCounts]);

    // Handle click outside to close filter
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if ((event.target as HTMLElement).classList.contains(styles.backdrop)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside as unknown as EventListener);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener);
        };
    }, [isOpen, onClose]);

    // Handle Escape key to close filter
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
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

    // Scroll to top helper
    const scrollToTop = useCallback(() => {
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
    }, []);

    // Toggle Sort By dropdown (close Colour dropdown if open)
    const handleToggleSortBy = useCallback(() => {
        setIsSortByOpen(prev => !prev);
        setIsColourOpen(false);
    }, []);

    // Toggle Colour dropdown (close Sort By dropdown if open)
    const handleToggleColourDropdown = useCallback(() => {
        setIsColourOpen(prev => !prev);
        setIsSortByOpen(false);
    }, []);

    // Handle sort option selection
    const handleSelectSort = useCallback((option: string) => {
        setSelectedSort(option);

        // Track filter apply event
        trackEvent.filterApply({
            filterType: 'sort',
            sortBy: option,
            selectedColors: selectedColors
        });

        // Scroll to top to see results
        scrollToTop();
    }, [setSelectedSort, selectedColors, scrollToTop]);

    // Handle colour selection (multi-select)
    const handleSelectColour = useCallback((colourName: string) => {
        const newSelectedColors = selectedColors.includes(colourName)
            ? selectedColors.filter(c => c !== colourName)
            : [...selectedColors, colourName];

        setSelectedColors(newSelectedColors);

        // Track filter apply event
        trackEvent.filterApply({
            filterType: 'color',
            selectedColors: newSelectedColors,
            sortBy: selectedSort
        });

        // Scroll to top to see results
        scrollToTop();
    }, [selectedColors, setSelectedColors, selectedSort, scrollToTop]);

    // Handle clear all filters
    const handleClearAll = useCallback(() => {
        setSelectedSort('Default');
        setSelectedColors([]);
        // Scroll to top on clear
        scrollToTop();
    }, [setSelectedSort, setSelectedColors, scrollToTop]);

    if (!isOpen) return null;

    return (
        <>
            {/* Dark Overlay */}
            <Backdrop isOpen={isOpen} onClick={onClose} zIndex={1999} />

            {/* Filter Panel */}
            <div ref={overlayRef} className={`${styles.overlayFilter} ${isOpen ? styles.show : ''} `} data-lenis-prevent>
                <div className={styles.box}>
                    <div className={styles.header}>
                        <span>Filter & Sort</span>
                        <div onClick={onClose} className={styles.closeIconWrapper}>
                            <CloseIcon fill="#0E0E0E" />
                        </div>
                    </div>
                    <div className={styles.selectors}>
                        {/* Sort By Section */}
                        <div className={styles.sortBy}>
                            <div className={styles.sortByLabel} onClick={handleToggleSortBy}>
                                <p>Sort By</p>
                                <ChevronIcon
                                    className={isSortByOpen ? styles.rotated : ''}
                                    fill="#0E0E0E"
                                />
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
                                <ChevronIcon
                                    className={isColourOpen ? styles.rotated : ''}
                                    fill="#0E0E0E"
                                />
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
});

Filter.displayName = 'Filter';

export default Filter;
