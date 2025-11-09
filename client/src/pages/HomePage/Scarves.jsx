import styles from './Scarves.module.css';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef, useState } from 'react';
import ScarfCard from '../../components/ProductCard/ScarfCard.jsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const scarves = [
    {
        id: '1',
        name: 'Elegant Silk Scarf',
        price: 79.99,
        image: '/images/scarf1.png'
    },
    {
        id: '2',
        name: 'Cashmere Winter Scarf',
        price: 129.99,
        image: '/images/scarf2.png'
    },
    {
        id: '3',
        name: 'Wool Check Scarf',
        price: 89.99,
        image: '/images/scarf3.png'
    },
    {
        id: '4',
        name: 'Cotton Summer Scarf',
        price: 59.99,
        image: '/images/scarf4.png'
    },
    {
        id: '5',
        name: 'Patterned Fashion Scarf',
        price: 69.99,
        image: '/images/scarf5.webp'
    },
    {
        id: '6',
        name: 'Linen Casual Scarf',
        price: 49.99,
        image: '/images/scarf6.png'
    },
    { 
        id: '7',
        name: 'Silk Blend Scarf',
        price: 89.99,
        image: '/images/scarf7.webp'
    },
    {
        id: '8',
        name: 'Alpaca Cozy Scarf',
        price: 139.99,
        image: '/images/scarf8.webp'
    },
    {
        id: '9',
        name: 'Fringed Wool Scarf',
        price: 99.99,
        image: '/images/scarf9.png'
    }
];

const Scarves = () => {
    const scarvesContainerRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    useGSAP(() => {
        const container = scarvesContainerRef.current;
        if (!container) return;

        gsap.set([".titleSplit", ".viewAllLinkSplit"], { opacity: 1 });

        const titleSplit = new SplitText(".titleSplit", { 
            type: "words, lines",
            lineClass: "line"
        });

        const linkSplit = new SplitText(".viewAllLinkSplit", { 
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
        })
        .from(linkSplit.lines, {
            duration: 0.8,
            yPercent: 50,
            opacity: 0,
            ease: "power3.out",
        }, "-=0.4");

    }, { scope: scarvesContainerRef });

    return (
        <div className={`${styles.scarves}`} ref={scarvesContainerRef}>
            <div className={`${styles.titleSectionScarves} titleSection`}>
                <h3 className="titleSplit">Scarves Collection</h3>
                <a href="#" className="viewAllLinkSplit">
                    View All
                </a>
            </div>

            <div className={styles.scarvesList}>
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={10}
                    slidesPerView="auto"
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                    }}
                    onBeforeInit={(swiper) => {
                        swiper.params.navigation.prevEl = prevRef.current;
                        swiper.params.navigation.nextEl = nextRef.current;
                    }}
                    onSlideChange={(swiper) => {
                        setIsBeginning(swiper.isBeginning);
                        setIsEnd(swiper.isEnd);
                    }}
                    onInit={(swiper) => {
                        setIsBeginning(swiper.isBeginning);
                        setIsEnd(swiper.isEnd);
                    }}
                    breakpoints={{
                        320: {
                            slidesPerView: 'auto',
                            spaceBetween: 10
                        },
                        768: {
                            slidesPerView: 'auto',
                            spaceBetween: 10
                        },
                        1024: {
                            slidesPerView: 'auto',
                            spaceBetween: 10
                        }
                    }}
                >
                    {scarves.map((scarf) => (
                        <SwiperSlide key={scarf.id}>
                            <ScarfCard scarf={scarf} />
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className={styles.arrows}>
                    <svg 
                        ref={prevRef}
                        className={isBeginning ? 'swiper-button-disabled' : ''}
                        xmlns="http://www.w3.org/2000/svg" 
                        width="50" 
                        height="50" 
                        viewBox="0 0 50 50" 
                        fill="none"
                    >
                        <path d="M33.3563 42.7094C33.6289 42.4303 33.7815 42.0557 33.7815 41.6656C33.7815 41.2755 33.6289 40.9009 33.3563 40.6219L18.1282 25L33.3563 9.38126C33.6289 9.10221 33.7815 8.7276 33.7815 8.33751C33.7815 7.94742 33.6289 7.5728 33.3563 7.29376C33.2238 7.15768 33.0654 7.04953 32.8904 6.97569C32.7155 6.90184 32.5275 6.86379 32.3375 6.86379C32.1476 6.86379 31.9596 6.90184 31.7847 6.97569C31.6097 7.04953 31.4513 7.15768 31.3188 7.29376L15.125 23.9094C14.8406 24.2012 14.6814 24.5925 14.6814 25C14.6814 25.4075 14.8406 25.7988 15.125 26.0906L31.3188 42.7063C31.4513 42.8423 31.6097 42.9505 31.7847 43.0243C31.9596 43.0982 32.1476 43.1362 32.3375 43.1362C32.5275 43.1362 32.7155 43.0982 32.8904 43.0243C33.0654 42.9505 33.2238 42.8423 33.3563 42.7063V42.7094Z" fill="#0E0E0E"/>
                    </svg>
                    <svg 
                        ref={nextRef}
                        className={isEnd ? 'swiper-button-disabled' : ''}
                        xmlns="http://www.w3.org/2000/svg" 
                        width="50" 
                        height="50" 
                        viewBox="0 0 50 50" 
                        fill="none"
                    >
                        <path d="M16.6437 7.29061C16.3711 7.56966 16.2185 7.94427 16.2185 8.33436C16.2185 8.72446 16.3711 9.09907 16.6437 9.37811L31.8718 25L16.6437 40.6187C16.3711 40.8978 16.2185 41.2724 16.2185 41.6625C16.2185 42.0526 16.3711 42.4272 16.6437 42.7062C16.7762 42.8423 16.9346 42.9505 17.1096 43.0243C17.2845 43.0982 17.4725 43.1362 17.6625 43.1362C17.8524 43.1362 18.0404 43.0982 18.2153 43.0243C18.3903 42.9505 18.5487 42.8423 18.6812 42.7062L34.875 26.0906C35.1594 25.7988 35.3186 25.4075 35.3186 25C35.3186 24.5925 35.1594 24.2012 34.875 23.9094L18.6812 7.29374C18.5487 7.15767 18.3903 7.04951 18.2153 6.97566C18.0404 6.90182 17.8524 6.86377 17.6625 6.86377C17.4725 6.86377 17.2845 6.90182 17.1096 6.97566C16.9346 7.04951 16.7762 7.15767 16.6437 7.29374V7.29061Z" fill="#0E0E0E"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Scarves;