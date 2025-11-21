import styles from './NewArrivals.module.css';
import ProductCard from '../../components/ProductCard/ProductCard';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef } from 'react';
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper"

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, MotionPathPlugin, MotionPathHelper);


const products = [
    {
        id: '1',
        name: 'Bi-Swing Jacket',
        price: 748.99,
        images: ['/images/newArr1.png', '/images/newArrHover1.png'],
        colors: [
            { name: 'Black', hex: 'var(--black)' },
            { name: 'Brown', hex: 'var(--brown)' },
            { name: 'Beige', hex: '#A99E8A' }
        ],
        tag: 'New'
    },
    {
        id: '2',
        name: 'Wool Cardigan',
        price: 2499.99,
        images: ['/images/newArr2.png', '/images/newArrHover2.png'],
        colors: [
            { name: 'Black', hex: 'var(--black)' },
            { name: 'Navy', hex: 'var(--midnight)' }
        ],
        tag: 'Limited Edition'
    },
    {
        id: '3',
        name: 'Donegal Tweed Coat',
        price: 3499.00,
        images: ['/images/newArr3.png', '/images/newArrHover3.png'],
        colors: [
            { name: 'Charcoal', hex: '#36454f' },
            { name: 'Camel', hex: '#C19A6B' }
        ],
        tag: 'Hot'
    },
    {
        id: '4',
        name: 'Donegal Tweed Coat',
        price: 3499.00,
        images: ['/images/newArr3.png', '/images/newArrHover3.png'],
        colors: [
            { name: 'Charcoal', hex: '#36454f' },
            { name: 'Camel', hex: '#C19A6B' }
        ],
        tag: 'Hot'
    }
];

const NewArrivals = () => {
    const newArrContainerRef = useRef(null);

    useGSAP(() => {
        const container = newArrContainerRef.current;
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
            }, "-=0.4")

            .from(`.${styles.productList} > *`, {
                duration: 0.6,
                y: 100,
                opacity: 0,
                stagger: 0.2,
                ease: "power2.in",
            }, "-=0.5");

    }, { scope: newArrContainerRef });

    return (
        <div className={`${styles.newArrivals} container`} ref={newArrContainerRef}>
            <div className="titleSection">
                <h3 className="titleSplit">New Arrivals, new journeys</h3>
                <a href="#" className="viewAllLinkSplit">
                    View All
                </a>
            </div>
            <div className={styles.productList}>
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default NewArrivals;