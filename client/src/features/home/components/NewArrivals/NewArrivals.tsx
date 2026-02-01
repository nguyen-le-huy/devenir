import { memo, useRef } from 'react';
import styles from './NewArrivals.module.css';
import ScarfCard from '@/features/products/components/ProductCard/ScarfCard';
import Loading from '@/shared/components/Loading/Loading';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper";
import { useNewArrivals } from '@/features/home/hooks/useHomeProducts';
import type { NewArrivalProduct, SplitTextInstance } from '@/features/home/types';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, MotionPathPlugin, MotionPathHelper);

const NewArrivals = memo(() => {
    const newArrContainerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const linkRef = useRef<HTMLAnchorElement>(null);

    // Use custom hook for data fetching
    const { products, isLoading, isError } = useNewArrivals(4);

    useGSAP(() => {
        const container = newArrContainerRef.current;
        const titleElement = titleRef.current;
        const linkElement = linkRef.current;

        if (!container || !titleElement || !linkElement) return;

        let titleSplitInstance: SplitTextInstance | null = null;
        let linkSplitInstance: SplitTextInstance | null = null;

        // Use refs instead of string selectors to ensure targets are found
        gsap.set([titleElement, linkElement], { opacity: 1 });

        document.fonts.ready.then(() => {
            titleSplitInstance = new SplitText(titleElement, {
                type: "words, lines",
                linesClass: "line"
            }) as unknown as SplitTextInstance;

            linkSplitInstance = new SplitText(linkElement, {
                type: "words, lines",
                linesClass: "line"
            }) as unknown as SplitTextInstance;

            // Wrap lines for overflow hidden (như ChatWindow)
            titleSplitInstance.lines.forEach((line: Element) => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode?.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            linkSplitInstance.lines.forEach((line: Element) => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode?.insertBefore(wrapper, line);
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

    // Loading state
    if (isLoading) {
        return (
            <div className={`${styles.newArrivals} container`}>
                <Loading />
            </div>
        );
    }

    // Error state - graceful fallback
    if (isError) {
        return null; // Silently fail on home page to not break UX
    }

    // Empty state
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section 
            className={`${styles.newArrivals} container`} 
            ref={newArrContainerRef}
            aria-labelledby="new-arrivals-title"
        >
            <div className="titleSection">
                <h3 id="new-arrivals-title" className="titleSplit" ref={titleRef}>
                    New Arrivals, new journeys
                </h3>
                <a href="/products?filter=new" className="viewAllLinkSplit" ref={linkRef}>
                    View All
                </a>
            </div>
            <div className={styles.productList}>
                {products.map((product: NewArrivalProduct) => (
                    <ScarfCard key={product.id} scarf={product} />
                ))}
            </div>
        </section>
    );
});

NewArrivals.displayName = 'NewArrivals';

export default NewArrivals;
