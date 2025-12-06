import styles from './NewArrivals.module.css';
import ScarfCard from '../../components/ProductCard/ScarfCard.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef, useMemo } from 'react';
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper";
import { useLatestVariants } from '../../hooks/useProducts.js';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, MotionPathPlugin, MotionPathHelper);

const NewArrivals = () => {
    const newArrContainerRef = useRef(null);

    // Fetch 4 latest variants
    const { data: variantsData, isLoading } = useLatestVariants(4);

    // Transform variant data to match ScarfCard expected format
    const products = useMemo(() => {
        if (!variantsData || variantsData.length === 0) return [];

        return variantsData.map(variant => ({
            id: variant._id,
            name: variant.productInfo?.name || 'Unknown Product',
            price: variant.price,
            image: variant.mainImage || '/images/placeholder.png',
            imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
        }));
    }, [variantsData]);

    useGSAP(() => {
        const container = newArrContainerRef.current;
        if (!container) return;

        let titleSplitInstance = null;
        let linkSplitInstance = null;

        gsap.set([".titleSplit", ".viewAllLinkSplit"], { opacity: 1 });

        document.fonts.ready.then(() => {
            titleSplitInstance = new SplitText(".titleSplit", {
                type: "words, lines",
                linesClass: "line"
            });

            linkSplitInstance = new SplitText(".viewAllLinkSplit", {
                type: "words, lines",
                linesClass: "line"
            });

            // Wrap lines for overflow hidden (như ChatWindow)
            titleSplitInstance.lines.forEach(line => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            linkSplitInstance.lines.forEach(line => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: "top 80%",
                }
            });

            tl.from(titleSplitInstance.lines, {
                duration: 0.8,
                yPercent: 100,
                opacity: 0,
                stagger: 0.08,
                ease: "power2.out",
            })
                .from(linkSplitInstance.lines, {
                    duration: 0.8,
                    yPercent: 100,
                    opacity: 0,
                    stagger: 0.08,
                    ease: "power2.out",
                }, "<")

                .from(`.${styles.productList} > *`, {
                    duration: 0.6,
                    y: 50,
                    opacity: 0,
                    stagger: 0.2,
                    ease: "power2.in",
                }, "<");
        });

        // Cleanup
        return () => {
            if (titleSplitInstance) titleSplitInstance.revert();
            if (linkSplitInstance) linkSplitInstance.revert();
        };

    }, { scope: newArrContainerRef, dependencies: [products] });

    if (isLoading) {
        return (
            <div className={`${styles.newArrivals} container`}>
                <Loading />
            </div>
        );
    }

    return (
        <div className={`${styles.newArrivals} container`} ref={newArrContainerRef}>
            <div className="titleSection">
                <h3 className="titleSplit">New Arrivals, new journeys</h3>
                <a href="#" className="viewAllLinkSplit">
                    View All
                </a>
            </div>
            <div className={styles.productList}>
                {products.length > 0 ? (
                    products.map(product => (
                        <ScarfCard key={product.id} scarf={product} />
                    ))
                ) : (
                    <p>No new arrivals yet.</p>
                )}
            </div>
        </div>
    );
};

export default NewArrivals;