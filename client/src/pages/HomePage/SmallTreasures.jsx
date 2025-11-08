import styles from './SmallTreasures.module.css';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from 'react';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP,ScrollTrigger,SplitText);

const SmallTreasures = () => {

    const smallTreasureRef = useRef(null);

    useGSAP(() => {
        const container = smallTreasureRef.current;
        if (!container) return;

        const images = gsap.utils.toArray(`.${styles.imageParallax}`);

        images.forEach((image, index) => {
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
            <div className={styles.title}>
                <h1>small</h1>
                <h1>treasures</h1>
            </div>
            <div className={styles.imageParallaxContainer}>
                <img className={`${styles.imageParallax} ${styles.image1}`} src="/images/treasure1.png" />
                <img className={`${styles.imageParallax} ${styles.image2}`} src="/images/treasure2.png" />
                <img className={`${styles.imageParallax} ${styles.image3}`} src="/images/treasure3.png" />
                <img className={`${styles.imageParallax} ${styles.image4}`} src="/images/treasure4.png" />
                <img className={`${styles.imageParallax} ${styles.image5}`} src="/images/treasure5.png" />
                <img className={`${styles.imageParallax} ${styles.image6}`} src="/images/treasure6.png" />
                <img className={`${styles.imageParallax} ${styles.image7}`} src="/images/treasure7.png" />
            </div>
        </div>
    );
};

export default SmallTreasures;