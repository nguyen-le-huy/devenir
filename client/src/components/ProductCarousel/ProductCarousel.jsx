import styles from './ProductCarousel.module.css';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef, useCallback, useState } from 'react';
import ScarfCard from '../ProductCard/ScarfCard.jsx';
import Loading from '../Loading/Loading.jsx';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const ProductCarousel = ({
    title = "Scarves Collection",
    viewAllLink = "#",
    products = [],
    showViewAll = true
}) => {
    const containerRef = useRef(null);
    // ✅ Sử dụng state thay vì ref để trigger re-render khi Swiper sẵn sàng
    const [swiperInstance, setSwiperInstance] = useState(null);

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

    useGSAP(() => {
        const container = containerRef.current;
        if (!container) return;

        gsap.set([".titleSplit", ".viewAllLinkSplit"], { opacity: 1 });

        const titleSplit = new SplitText(container.querySelector(".titleSplit"), {
            type: "words, lines",
            lineClass: "line"
        });

        const linkSplit = container.querySelector(".viewAllLinkSplit");
        let linkSplitInstance = null;

        if (linkSplit && showViewAll) {
            linkSplitInstance = new SplitText(linkSplit, {
                type: "words, lines",
                lineClass: "line"
            });
        }

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

        if (linkSplitInstance && showViewAll) {
            tl.from(linkSplitInstance.lines, {
                duration: 0.8,
                yPercent: 50,
                opacity: 0,
                ease: "power3.out",
            }, "-=0.4");
        }

    }, { scope: containerRef, dependencies: [title, showViewAll] });

    // ✅ Kiểm tra có products không
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
                        loop={products.length > 4} // ✅ Chỉ loop khi có đủ slides
                        speed={400}
                        breakpoints={{
                            320: {
                                slidesPerView: 2,
                                spaceBetween: 2,
                            },
                            640: {
                                slidesPerView: 2,
                                spaceBetween: 2,
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
                        onSwiper={(swiper) => setSwiperInstance(swiper)}
                    >
                        {products.map((product) => (
                            <SwiperSlide key={product.id}>
                                <ScarfCard scarf={product} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    // ✅ Placeholder khi không có products
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loading inline size="md" />
                    </div>
                )}

                {/* ✅ Chỉ hiển thị arrows khi có products và swiperInstance sẵn sàng */}
                {hasProducts && (
                    <div className={styles.arrows}>
                        <svg
                            onClick={handlePrev}
                            style={{ cursor: 'pointer' }}
                            xmlns="http://www.w3.org/2000/svg"
                            width="50"
                            height="50"
                            viewBox="0 0 50 50"
                            fill="none"
                        >
                            <path d="M33.3563 42.7094C33.6289 42.4303 33.7815 42.0557 33.7815 41.6656C33.7815 41.2755 33.6289 40.9009 33.3563 40.6219L18.1282 25L33.3563 9.38126C33.6289 9.10221 33.7815 8.7276 33.7815 8.33751C33.7815 7.94742 33.6289 7.5728 33.3563 7.29376C33.2238 7.15768 33.0654 7.04953 32.8904 6.97569C32.7155 6.90184 32.5275 6.86379 32.3375 6.86379C32.1476 6.86379 31.9596 6.90184 31.7846 6.97569C31.6096 7.04953 31.4513 7.15768 31.3187 7.29376L15.3563 23.9594C15.0837 24.2384 14.9311 24.613 14.9311 25.0031C14.9311 25.3932 15.0837 25.7678 15.3563 26.0469L31.3187 42.7125C31.4513 42.8486 31.6096 42.9567 31.7846 43.0306C31.9596 43.1044 32.1476 43.1425 32.3375 43.1425C32.5275 43.1425 32.7155 43.1044 32.8904 43.0306C33.0654 42.9567 33.2238 42.8486 33.3563 42.7094Z" fill="#0E0E0E" />
                        </svg>
                        <svg
                            onClick={handleNext}
                            style={{ cursor: 'pointer' }}
                            xmlns="http://www.w3.org/2000/svg"
                            width="50"
                            height="50"
                            viewBox="0 0 50 50"
                            fill="none"
                        >
                            <path d="M16.6437 7.29061C16.3711 7.56966 16.2185 7.94427 16.2185 8.33436C16.2185 8.72446 16.3711 9.09907 16.6437 9.37811L31.8718 25L16.6437 40.6187C16.3711 40.8978 16.2185 41.2724 16.2185 41.6625C16.2185 42.0526 16.3711 42.4272 16.6437 42.7062C16.7762 42.8423 16.9346 42.9505 17.1096 43.0243C17.2845 43.0982 17.4725 43.1362 17.6625 43.1362C17.8524 43.1362 18.0404 43.0982 18.2154 43.0243C18.3903 42.9505 18.5487 42.8423 18.6812 42.7062L34.6437 26.0406C34.9163 25.7616 35.0689 25.387 35.0689 24.9969C35.0689 24.6068 34.9163 24.2322 34.6437 23.9531L18.6812 7.28749C18.5487 7.15141 18.3903 7.04326 18.2154 6.96941C18.0404 6.89557 17.8524 6.85752 17.6625 6.85752C17.4725 6.85752 17.2845 6.89557 17.1096 6.96941C16.9346 7.04326 16.7762 7.15141 16.6437 7.29061Z" fill="#0E0E0E" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCarousel;