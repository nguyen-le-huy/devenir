import styles from './CategoryBox.module.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useRef } from 'react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const CategoryBox = () => {
    const swiperRef = useRef<any>(null);

    const handlePrevClick = () => {
        if (swiperRef.current) {
            swiperRef.current.slidePrev();
        }
    };

    const handleNextClick = () => {
        if (swiperRef.current) {
            swiperRef.current.slideNext();
        }
    };

    return (
        <div className={`${styles.categoryBox}`}>
            <div className={`${styles.box1} ${styles.box} ${styles.stickyBox}`}>
                <video
                    className={styles.videoBackground}
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src="/videos/TheGiftGuide.webm" type="video/webm" />
                </video>
                <div className={`${styles.contentBox} ${styles.stickyContent}`}>
                    <h2 className={styles.title}>New In Jackets</h2>
                    <p className={styles.description}>Discover timeless craftsmanship and modern silhouettes for the season ahead.</p>
                    <a className={styles.link} href="#">Shop Now</a>
                </div>
            </div>
            <div className={`${styles.box2} ${styles.box} ${styles.stickyBox}`} style={{
                backgroundImage: `url('/images/category2.webp')`
            }}>
                <div className={`${styles.contentBox} ${styles.stickyContent}`}>
                    <h2 className={styles.title}>New In Jackets</h2>
                    <p className={styles.description}>Discover timeless craftsmanship and modern silhouettes for the season ahead.</p>
                    <a className={styles.link} href="#">Shop Now</a>
                </div>
            </div>
            <div className={`${styles.box3} ${styles.box} ${styles.stickyBox}`}>
                <video
                    className={styles.videoBackground}
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src="/videos/customShop.webm" type="video/webm" />
                </video>
                <div className={`${styles.contentBox} ${styles.stickyContent}`}>
                    <h2 className={styles.title}>New In Sweaters</h2>
                    <p className={styles.description}>Discover timeless craftsmanship and modern silhouettes for the season ahead.</p>
                    <a className={styles.link} href="#">Shop Now</a>
                </div>
            </div>
            <div className={`${styles.box4} ${styles.box}`}>
                <div className={styles.productSliders}>
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={30}
                        slidesPerView={'auto'}
                        centeredSlides={true}
                        loop={true}
                        speed={600}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        pagination={{
                            el: `.${styles.navigation}`,
                            clickable: true,
                            renderBullet: function (_index, className) {
                                return `<span class="${className}"></span>`;
                            }
                        }}
                        className={styles.swiperContainer}
                    >
                        <SwiperSlide className={styles.swiperSlide}>
                            <img src="/images/prd1.png" alt="Product 1" />
                        </SwiperSlide>
                        <SwiperSlide className={styles.swiperSlide}>
                            <img src="/images/prd2.png" alt="Product 2" />
                        </SwiperSlide>
                        <SwiperSlide className={styles.swiperSlide}>
                            <img src="/images/prd3.png" alt="Product 3" />
                        </SwiperSlide>
                        <SwiperSlide className={styles.swiperSlide}>
                            <img src="/images/prd1.png" alt="Product 1" />
                        </SwiperSlide>
                        <SwiperSlide className={styles.swiperSlide}>
                            <img src="/images/prd2.png" alt="Product 2" />
                        </SwiperSlide>
                        <SwiperSlide className={styles.swiperSlide}>
                            <img src="/images/prd3.png" alt="Product 3" />
                        </SwiperSlide>
                    </Swiper>

                    <div className={styles.arrows}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 50 50"
                            fill="none"
                            onClick={handlePrevClick}
                        >
                            <path d="M29.7565 7.29374L13.5627 23.9062C13.2783 24.198 13.1191 24.5894 13.1191 24.9969C13.1191 25.4043 13.2783 25.7957 13.5627 26.0875L29.7565 42.7062C29.889 42.8423 30.0474 42.9505 30.2224 43.0243C30.3973 43.0982 30.5853 43.1362 30.7752 43.1362C30.9652 43.1362 31.1532 43.0982 31.3281 43.0243C31.5031 42.9505 31.6615 42.8423 31.794 42.7062C32.0666 42.4272 32.2192 42.0526 32.2192 41.6625C32.2192 41.2724 32.0666 40.8978 31.794 40.6187L16.5659 24.9969L31.794 9.37811C32.0656 9.09921 32.2177 8.72526 32.2177 8.33593C32.2177 7.94659 32.0656 7.57264 31.794 7.29374C31.6615 7.15767 31.5031 7.04951 31.3281 6.97566C31.1532 6.90182 30.9652 6.86377 30.7752 6.86377C30.5853 6.86377 30.3973 6.90182 30.2224 6.97566C30.0474 7.04951 29.889 7.15767 29.7565 7.29374Z" fill="white" />
                        </svg>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 50 50"
                            fill="none"
                            onClick={handleNextClick}
                        >
                            <path d="M16.644 7.29061C16.3714 7.56966 16.2188 7.94427 16.2188 8.33436C16.2188 8.72446 16.3714 9.09907 16.644 9.37811L31.8721 25L16.644 40.6187C16.3714 40.8978 16.2188 41.2724 16.2188 41.6625C16.2187 42.0526 16.3714 42.4272 16.644 42.7062C16.7764 42.8423 16.9348 42.9505 17.1098 43.0243C17.2848 43.0982 17.4728 43.1362 17.6627 43.1362C17.8526 43.1362 18.0406 43.0982 18.2156 43.0243C18.3906 42.9505 18.549 42.8423 18.6815 42.7062L34.8752 26.0906C35.1596 25.7988 35.3188 25.4075 35.3188 25C35.3188 24.5925 35.1596 24.2012 34.8752 23.9094L18.6815 7.29374C18.549 7.15767 18.3906 7.04951 18.2156 6.97566C18.0406 6.90182 17.8526 6.86377 17.6627 6.86377C17.4728 6.86377 17.2848 6.90182 17.1098 6.97566C16.9348 7.04951 16.7764 7.15767 16.644 7.29374V7.29061Z" fill="white" />
                        </svg>
                    </div>
                </div>

                <div className={styles.navigation}></div>

                <div className={`${styles.contentBox} ${styles.box4Content}`}>
                    <h2 className={styles.title}>For Every Adventure</h2>
                    <p className={styles.description}>Elevate your wardrobe with classic coats and jackets in seasonal tones and the unmistakable Burberry Check. Discover stylish solutions for the coming months, including warm puffers, quilted styles and relaxed bomber jackets.</p>
                    <a className={styles.link} href="#">Shop Now</a>
                </div>
            </div>
            <div className={`${styles.box5} ${styles.box} ${styles.stickyBox}`} style={{
                backgroundImage: `url('/images/category5.webp')`
            }}>
                <div className={`${styles.contentBox} ${styles.stickyContent}`}>
                    <h2 className={styles.title}>The Gift Guide</h2>
                    <p className={styles.description}>A curated selection of timeless gifts from the World of Ralph Lauren to celebrate the season</p>
                    <a className={styles.link} href="#">Find a Gift</a>
                </div>
            </div>
        </div>
    );
};

export default CategoryBox;
