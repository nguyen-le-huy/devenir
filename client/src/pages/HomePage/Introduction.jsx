import styles from './Introduction.module.css';
import gsap from 'gsap';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const Introduction = () => {
    const cardsContainerRef = useRef(null);
    const introContainerRef = useRef(null);
    const introTextRef = useRef(null);

    useGSAP(() => {
        const container = cardsContainerRef.current;
        const introContainer = introContainerRef.current;

        if (!container || !introContainer) return;

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


        // ScrollTrigger
        ScrollTrigger.create({
            trigger: introContainer,
            start: 'top 50%',
            onEnter: () => {
                gsap.to(introContainer, {
                    backgroundColor: '#5C4439',
                    duration: 0.5
                });
                gsap.to(introTextRef.current, {
                    color: '#FFFFFF',
                    duration: 0.5
                });
            }
        });
        
        


    }, { scope: introContainerRef });

    return (
        <div className={ `${styles.introduction} container`} ref={introContainerRef}>
            <h1 className={styles.title} ref={introTextRef}>
                Timeless, seasonal and unmistakably Burberry, find the perfect gifts for everyone on your list.
            </h1>
            <div className={styles.introCards} ref={cardsContainerRef}>
                {/* Set 1: Cards gốc */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.png" alt="Intro card 1" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.png" alt="Intro card 2" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.png" alt="Intro card 3" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.png" alt="Intro card 4" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.png" alt="Intro card 5" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.png" alt="Intro card 6" />
                </div>

                
                {/* Set 2: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.png" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.png" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.png" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.png" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.png" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.png" alt="Intro card 6 duplicate" />
                </div>


                {/* Set 3: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.png" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.png" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.png" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.png" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.png" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.png" alt="Intro card 6 duplicate" />
                </div>

                {/* Set 4: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.png" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.png" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.png" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.png" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.png" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.png" alt="Intro card 6 duplicate" />
                </div>

                {/* Set 5: Duplicate để tạo seamless loop */}
                <div className={styles.introCard}>
                    <img src="images/introCard1.png" alt="Intro card 1 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard2.png" alt="Intro card 2 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard3.png" alt="Intro card 3 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard4.png" alt="Intro card 4 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard5.png" alt="Intro card 5 duplicate" />
                </div>
                <div className={styles.introCard}>
                    <img src="images/introCard6.png" alt="Intro card 6 duplicate" />
                </div>
            </div>
        </div>
    );
}

export default Introduction;