import styles from './ProductCarousel.module.css';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef, useCallback, useState, memo } from 'react';
import ScarfCard from '../ProductCard/ScarfCard';
import Loading from '@/shared/components/Loading/Loading';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { ArrowLeftIcon } from '@/shared/components/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@/shared/components/icons/ArrowRightIcon';

import 'swiper/css';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * ProductCarousel Component
 * Displays a carousel of product cards with navigation arrows
 * Supports responsive breakpoints and GSAP animations
 */

// Base interface for products that can be displayed in carousel
interface BaseCarouselProduct {
    _id?: string;
    id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Allow additional properties for flexibility
}

interface ProductCarouselProps {
    title?: string;
    viewAllLink?: string;
    products?: BaseCarouselProduct[];
    showViewAll?: boolean;
}

const ProductCarousel = memo(({
    title = "Scarves Collection",
    viewAllLink = "#",
    products = [],
    showViewAll = true
}: ProductCarouselProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
    const [currentSlidesPerView, setCurrentSlidesPerView] = useState(4);

    // Manual navigation handlers
    const handlePrev = useCallback(() => {
        if (swiperInstance) {
            swiperInstance.slidePrev();
        }
    }, [swiperInstance]);

    const handleNext = useCallback(() => {
        if (swiperInstance) {
            swiperInstance.slideNext();
        }
    }, [swiperInstance]);

    // GSAP Animation for title and link
    useGSAP(() => {
        const container = containerRef.current;
        if (!container) return;

        // Wait for fonts to load before splitting text
        document.fonts.ready.then(() => {
            const targetsToSet = [".titleSplit"];
            if (showViewAll) {
                targetsToSet.push(".viewAllLinkSplit");
            }
            gsap.set(targetsToSet, { opacity: 1 });

            const titleSplitElement = container.querySelector(".titleSplit");
            if (titleSplitElement) {
                const titleSplit = new SplitText(titleSplitElement, {
                    type: "words, lines",
                    lineClass: "line"
                });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        start: "top 80%"
                    }
                });

                tl.from(titleSplit.lines, {
                    duration: 0.8,
                    yPercent: 50,
                    opacity: 0,
                    ease: "power3.out",
                });

                if (showViewAll) {
                    const linkSplitElement = container.querySelector(".viewAllLinkSplit");
                    if (linkSplitElement) {
                        const linkSplitInstance = new SplitText(linkSplitElement, {
                            type: "words, lines",
                            lineClass: "line"
                        });

                        tl.from(linkSplitInstance.lines, {
                            duration: 0.8,
                            yPercent: 50,
                            opacity: 0,
                            ease: "power3.out",
                        }, "-=0.4");
                    }
                }
            }
        });
    }, { scope: containerRef, dependencies: [title, showViewAll] });

    const hasProducts = products && products.length > 0;

    return (
        <div className={styles.productCarousel} ref={containerRef}>
            <div className={`${styles.titleSection} titleSection`}>
                <h3 className="titleSplit">{title}</h3>
                {showViewAll && (
                    <a href={viewAllLink} className="viewAllLinkSplit">
                        View All
                    </a>
                )}
            </div>

            <div className={styles.productList}>
                {hasProducts ? (
                    <Swiper
                        spaceBetween={20}
                        slidesPerView={4}
                        slidesPerGroup={1}
                        allowTouchMove={true}
                        loop={products.length > 4}
                        speed={400}
                        breakpoints={{
                            320: {
                                slidesPerView: 1,
                                spaceBetween: 0,
                            },
                            640: {
                                slidesPerView: 1,
                                spaceBetween: 0,
                            },
                            1024: {
                                slidesPerView: 3,
                                spaceBetween: 2,
                            },
                            1280: {
                                slidesPerView: 4,
                                spaceBetween: 2,
                            },
                        }}
                        onSwiper={(swiper) => {
                            setSwiperInstance(swiper);
                            // Get initial slidesPerView
                            if (typeof swiper.params.slidesPerView === 'number') {
                                setCurrentSlidesPerView(swiper.params.slidesPerView);
                            }
                        }}
                        onBreakpoint={(_swiper, breakpointParams) => {
                            if (typeof breakpointParams.slidesPerView === 'number') {
                                setCurrentSlidesPerView(breakpointParams.slidesPerView);
                            }
                        }}
                    >
                        {products.map((product) => (
                            <SwiperSlide key={product._id || product.id}>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <ScarfCard scarf={product as any} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loading inline size="md" />
                    </div>
                )}

                {/* Navigation arrows - only show when there are more products than visible slides */}
                {hasProducts && products.length > currentSlidesPerView && (
                    <div className={styles.arrows}>
                        <ArrowLeftIcon
                            onClick={handlePrev}
                            style={{ cursor: 'pointer' }}
                            fill="#0E0E0E"
                        />
                        <ArrowRightIcon
                            onClick={handleNext}
                            style={{ cursor: 'pointer' }}
                            fill="#0E0E0E"
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

ProductCarousel.displayName = 'ProductCarousel';

export default ProductCarousel;
