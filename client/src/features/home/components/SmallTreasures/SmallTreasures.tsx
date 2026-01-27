import styles from './SmallTreasures.module.css';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from 'react';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const SmallTreasures = () => {
    const titleRef = useRef<HTMLDivElement>(null);
    const smallTreasureRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const container = smallTreasureRef.current;
        if (!container) return;

        const images = gsap.utils.toArray(`.${styles.imageParallax}`) as Element[];

        gsap.from(titleRef.current, {
            opacity: 0,
            duration: 1,
            scrollTrigger: {
                trigger: container,
                start: "top 50%",
                end: "bottom top",
            }
        })

        images.forEach((image: Element, index: number) => {
            const speeds = [-300, -350, -280, -320, -290, -330, -200];
            const speed = speeds[index] || 100;

            gsap.to(image, {
                y: speed,
                ease: "none",
                scrollTrigger: {
                    trigger: container,
                    start: "top 60%",
                    end: "bottom top",
                    scrub: 1,
                }
            })
        });

    }, { scope: smallTreasureRef });


    return (
        <div className={`${styles.smallTreasures}`} ref={smallTreasureRef}>
            <div className={styles.title} ref={titleRef}>
                <h1>small</h1>
                <h1>treasures</h1>
            </div>
            <button className="button--surtur">
                <svg className="textcircle" viewBox="0 0 500 500">
                    <title>Projects & client work 2025</title>
                    <defs>
                        <path id="textcircle" d="M250,400 a150,150 0 0,1 0,-300a150,150 0 0,1 0,300Z" />
                    </defs>
                    <text>
                        <textPath xlinkHref="#textcircle" aria-label="Projects & client work 2025" textLength="900">
                            Projects &amp; client work 2025
                        </textPath>
                    </text>
                </svg>
                <svg aria-hidden="true" className="eye" width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
                    <path className="eye__outer" d="M10.5 35.308c5.227-7.98 14.248-13.252 24.5-13.252s19.273 5.271 24.5 13.252c-5.227 7.98-14.248 13.253-24.5 13.253s-19.273-5.272-24.5-13.253z" />
                    <path className="eye__lashes-up" d="M35 8.802v8.836M49.537 11.383l-3.31 8.192M20.522 11.684l3.31 8.192" />
                    <path className="eye__lashes-down" d="M35 61.818v-8.836 8.836zM49.537 59.237l-3.31-8.193 3.31 8.193zM20.522 58.936l3.31-8.193-3.31 8.193z" />
                    <circle className="eye__iris" cx="35" cy="35.31" r="5.221" />
                    <circle className="eye__inner" cx="35" cy="35.31" r="10.041" />
                </svg>
            </button>
            <div className={styles.imageParallaxContainer}>
                <img className={`${styles.imageParallax} ${styles.image1}`} src="/images/treasure1.webp" />
                <img className={`${styles.imageParallax} ${styles.image2}`} src="/images/treasure2.webp" />
                <img className={`${styles.imageParallax} ${styles.image3}`} src="/images/treasure3.webp" />
                <img className={`${styles.imageParallax} ${styles.image4}`} src="/images/treasure4.webp" />
                <img className={`${styles.imageParallax} ${styles.image5}`} src="/images/treasure5.webp" />
                <img className={`${styles.imageParallax} ${styles.image6}`} src="/images/treasure6.webp" />
                <img className={`${styles.imageParallax} ${styles.image7}`} src="/images/treasure7.webp" />
            </div>
        </div>
    );
};

export default SmallTreasures;
