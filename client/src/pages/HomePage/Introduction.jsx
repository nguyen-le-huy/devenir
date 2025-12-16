import styles from './Introduction.module.css';
import gsap from 'gsap';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from 'gsap/src/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const Introduction = () => {
    const cardsContainerRef = useRef(null);
    const introContainerRef = useRef(null);
    const introTextRef = useRef(null);

    useGSAP(() => {
        const container = cardsContainerRef.current;
        const introContainer = introContainerRef.current;
        const introText = introTextRef.current;

        if (!container || !introContainer || !introText) return;

        // Lấy chiều rộng của một set cards (5 cards)
        const cardWidth = 460;
        const gap = 10;
        const totalWidth = (cardWidth + gap) * 5;

        // Set initial scroll position
        container.scrollLeft = 0;

        // Infinite loop animation
        const tl = gsap.timeline({
            repeat: -1,
            onRepeat: () => {
                // Reset về vị trí đầu khi kết thúc một vòng lặp
                container.scrollLeft = 0;
            }
        });

        tl.to(container, {
            scrollLeft: totalWidth,
            duration: 60,
            ease: 'none'
        });

        // SplitText animation for title (like ChatWindow)
        let splitInstance = null;

        // Set initial opacity
        gsap.set(introText, { opacity: 1 });

        document.fonts.ready.then(() => {
            splitInstance = new SplitText(introText, {
                type: "words,lines",
                linesClass: "line"
            });

            // Wrap lines for overflow hidden (như ChatWindow)
            splitInstance.lines.forEach(line => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            // Set initial state for lines
            gsap.set(splitInstance.lines, { yPercent: 100, opacity: 0 });

            // ScrollTrigger for text animation
            ScrollTrigger.create({
                trigger: introContainer,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(splitInstance.lines, {
                        duration: 0.8,
                        yPercent: 0,
                        opacity: 1,
                        stagger: 0.08,
                        ease: "power2.out",
                    });
                }
            });
        });

        // ScrollTrigger for background color
        ScrollTrigger.create({
            trigger: introContainer,
            start: 'top 20%',
            onEnter: () => {
                gsap.to(introContainer, {
                    backgroundColor: '#5C4439',
                    duration: 0.5
                });
                gsap.to(introText, {
                    color: '#FFFFFF',
                    duration: 0.5
                });
            }
        });

        // Cleanup
        return () => {
            if (splitInstance) {
                splitInstance.revert();
            }
        };

    }, { scope: introContainerRef });

    return (
        <div className={`${styles.introduction}`} ref={introContainerRef}>
            <h1 className={styles.title} ref={introTextRef}>
                Timeless, seasonal and unmistakably Burberry, find the perfect gifts for everyone on your list.
            </h1>
            <div className={styles.introCards} ref={cardsContainerRef}>
                {/* Set 1: Cards gốc */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.webp" alt="Intro card 1" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.webp" alt="Intro card 2" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.webp" alt="Intro card 3" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.webp" alt="Intro card 4" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.webp" alt="Intro card 5" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.webp" alt="Intro card 6" />
                </div>


                {/* Set 2: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.webp" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.webp" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.webp" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.webp" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.webp" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.webp" alt="Intro card 6 duplicate" />
                </div>


                {/* Set 3: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.webp" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.webp" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.webp" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.webp" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.webp" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.webp" alt="Intro card 6 duplicate" />
                </div>

                {/* Set 4: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.webp" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.webp" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.webp" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.webp" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.webp" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.webp" alt="Intro card 6 duplicate" />
                </div>

                {/* Set 5: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.webp" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.webp" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.webp" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.webp" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.webp" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.webp" alt="Intro card 6 duplicate" />
                </div>
            </div>
        </div>
    );
}

export default Introduction;