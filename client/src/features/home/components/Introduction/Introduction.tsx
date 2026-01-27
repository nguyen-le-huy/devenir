import styles from './Introduction.module.css';
import gsap from 'gsap';
import { useRef, memo } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import SplitText from 'gsap/src/SplitText';
import { horizontalLoop } from '@/shared/utils/gsapHelpers';
import type { IntroCard, SplitTextInstance, HorizontalLoopTimeline } from '@/features/home/types';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Draggable);

const introCards: IntroCard[] = [
    { src: "images/introCard1.webp", alt: "Intro card 1" },
    { src: "images/introCard2.webp", alt: "Intro card 2" },
    { src: "images/introCard3.webp", alt: "Intro card 3" },
    { src: "images/introCard4.webp", alt: "Intro card 4" },
    { src: "images/introCard5.webp", alt: "Intro card 5" },
    { src: "images/introCard6.webp", alt: "Intro card 6" },
];

const Introduction = memo(() => {
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const introContainerRef = useRef<HTMLDivElement>(null);
    const introTextRef = useRef<HTMLHeadingElement>(null);
    const loopRef = useRef<HorizontalLoopTimeline | null>(null);

    useGSAP(() => {
        const container = cardsContainerRef.current;
        const introContainer = introContainerRef.current;
        const introText = introTextRef.current;

        if (!container || !introContainer || !introText) return;

        // Get all card elements
        const boxes = gsap.utils.toArray(container.querySelectorAll(`.${styles.introCard}`)) as HTMLElement[];

        if (!boxes.length) return;

        // Calculate card width based on container
        const containerWidth = container.offsetWidth;
        const cardWidth = Math.min(460, containerWidth * 0.8); // Responsive card width

        // Set initial positions for cards
        gsap.set(boxes, {
            x: (i) => i * (cardWidth + 10) // cardWidth + gap
        });

        // Initialize the horizontal loop
        // Config for horizontalLoop
        loopRef.current = horizontalLoop(boxes, {
            paused: false,
            draggable: true,
            repeat: -1,
            speed: 0.5, // Adjust speed as needed
            paddingRight: 10 // Gap between cards
        });

        // Handle window resize to update widths
        const handleResize = () => {
            if (loopRef.current && typeof loopRef.current.refresh === 'function') {
                // We need to reset progress to ensure calculations are correct
                const currentProgress = loopRef.current.progress();
                loopRef.current.progress(0);
                loopRef.current.refresh();
                loopRef.current.progress(currentProgress);
            }
        };

        window.addEventListener('resize', handleResize);

        // SplitText animation for title (like ChatWindow)
        let splitInstance: SplitTextInstance | null = null;

        // Set initial opacity
        gsap.set(introText, { opacity: 1 });

        document.fonts.ready.then(() => {
            splitInstance = new SplitText(introText, {
                type: "words,lines",
                linesClass: "line"
            });

            // Wrap lines for overflow hidden
            splitInstance.lines.forEach((line: Element) => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode?.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            // Set initial state for lines
            gsap.set(splitInstance.lines, { yPercent: 100, opacity: 0 });

            // ScrollTrigger for text animation
            ScrollTrigger.create({
                trigger: introContainer,
                start: 'top 80%',
                onEnter: () => {
                    if (splitInstance && splitInstance.lines) {
                        gsap.to(splitInstance.lines, {
                            duration: 0.8,
                            yPercent: 0,
                            opacity: 1,
                            stagger: 0.08,
                            ease: "power2.out",
                        });
                    }
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
            window.removeEventListener('resize', handleResize);
            if (splitInstance) {
                splitInstance.revert();
            }
            if (loopRef.current) {
                loopRef.current.kill();
            }
        };

    }, { scope: introContainerRef });

    return (
        <div className={`${styles.introduction}`} ref={introContainerRef}>
            <h1 className={styles.title} ref={introTextRef}>
                Timeless, seasonal and unmistakably Burberry, find the perfect gifts for everyone on your list.
            </h1>
            <div className={styles.introCards} ref={cardsContainerRef}>
                {introCards.map((card, index) => (
                    <div key={index} className={styles.introCard}>
                        <img src={card.src} alt={card.alt} loading="lazy" decoding="async" />
                    </div>
                ))}
            </div>
        </div>
    );
});

Introduction.displayName = 'Introduction';

export default Introduction;
