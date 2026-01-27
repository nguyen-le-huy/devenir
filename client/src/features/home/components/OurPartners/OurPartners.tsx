import styles from './OurPartners.module.css';
import { useRef, useEffect, memo } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Draggable } from 'gsap/Draggable';
import { useGSAP } from '@gsap/react';
import { horizontalLoop } from '@/shared/utils/gsapHelpers';
import type { PartnerLogo, SplitTextInstance, HorizontalLoopTimeline } from '@/features/home/types';

gsap.registerPlugin(SplitText, ScrambleTextPlugin, Draggable, useGSAP);

const partners: PartnerLogo[] = [
    { id: 1, src: '/images/partner1.svg', alt: 'Partner 1' },
    { id: 2, src: '/images/partner2.svg', alt: 'Partner 2' },
    { id: 3, src: '/images/partner3.svg', alt: 'Partner 3' },
    { id: 4, src: '/images/partner4.svg', alt: 'Partner 4' },
    { id: 5, src: '/images/partner5.svg', alt: 'Partner 5' },
    { id: 6, src: '/images/partner6.svg', alt: 'Partner 6' },
];

const OurPartners = memo(() => {
    const titleRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const logosContainerRef = useRef<HTMLDivElement>(null);
    const loopRef = useRef<HorizontalLoopTimeline | null>(null);

    // GSAP Horizontal Loop with Drag
    useGSAP(() => {
        const container = logosContainerRef.current;
        if (!container) return;

        const logos = gsap.utils.toArray(container.querySelectorAll(`.${styles.logoItem}`)) as HTMLElement[];
        if (logos.length === 0) return;

        // Calculate logo width
        const logoWidth = 250; // max-width from CSS
        const gap = 100;

        // Set initial positions
        gsap.set(logos, {
            x: (i) => i * (logoWidth + gap)
        });

        // Initialize the horizontal loop using shared utility
        loopRef.current = horizontalLoop(logos, {
            paused: false,
            draggable: true,
            repeat: -1,
            speed: 0.3, // Slower speed for logos
            paddingRight: gap
        }) as HorizontalLoopTimeline;

        return () => {
            if (loopRef.current) {
                loopRef.current.kill();
            }
        };
    }, { scope: logosContainerRef });

    // Title scramble effect
    useEffect(() => {
        const titles = titleRef.current?.querySelectorAll('h1');

        // Map text gốc với text target khi hover
        const textMapping: Record<string, string> = {
            'Our': 'By',
            'Partners': 'HyStudio'
        };

        const cleanupFunctions: (() => void)[] = [];

        titles?.forEach((title: HTMLHeadingElement) => {
            const originalText = title.textContent || '';
            const targetText = textMapping[originalText] || originalText;
            let split: SplitTextInstance | null = null;

            const handleMouseEnter = () => {
                // Kill animations cũ nếu có
                if (split?.chars) {
                    gsap.killTweensOf(split.chars);
                }

                // Split text khi hover
                split = new SplitText(title, { type: 'chars', charsClass: 'char' });

                // Tính padding để căn giữa text ngắn hơn
                const originalLength = originalText.length;
                const targetLength = targetText.length;
                const paddedTarget = targetLength < originalLength
                    ? targetText.padEnd(originalLength, ' ')
                    : targetText;

                split?.chars.forEach((char: Element, index: number) => {
                    const targetChar = paddedTarget[index] || ' ';

                    gsap.to(char, {
                        duration: 0.8,
                        delay: index * 0.05,
                        scrambleText: {
                            text: targetChar,
                            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                            revealDelay: 0.3,
                            speed: 0.5
                        }
                    });
                });
            };

            const handleMouseLeave = () => {
                // Kill tất cả animations
                if (split?.chars) {
                    gsap.killTweensOf(split.chars);

                    // Scramble về text gốc
                    split?.chars.forEach((char: Element, index: number) => {
                        const originalChar = originalText[index] || ' ';

                        gsap.to(char, {
                            duration: 0.8,
                            delay: index * 0.05,
                            scrambleText: {
                                text: originalChar,
                                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                                revealDelay: 0.3,
                                speed: 0.5
                            },
                            onComplete: () => {
                                // Revert về DOM ban đầu sau khi hoàn thành
                                if (split && index === split.chars.length - 1) {
                                    setTimeout(() => {
                                        if (split) {
                                            split.revert();
                                            title.textContent = originalText;
                                        }
                                    }, 100);
                                }
                            }
                        });
                    });
                }
            };

            title.addEventListener('mouseenter', handleMouseEnter);
            title.addEventListener('mouseleave', handleMouseLeave);

            // Lưu cleanup function
            cleanupFunctions.push(() => {
                title.removeEventListener('mouseenter', handleMouseEnter);
                title.removeEventListener('mouseleave', handleMouseLeave);
                if (split) {
                    split.revert();
                }
            });
        });

        // Cleanup
        return () => {
            cleanupFunctions.forEach(fn => fn());
        };
    }, []);

    return (
        <div className={styles.ourPartners} ref={containerRef}>
            <div className={styles.title} ref={titleRef}>
                <h1>Our</h1>
                <h1>Partners</h1>
            </div>

            <div className={styles.logosContainer} ref={logosContainerRef}>
                {partners.map((partner) => (
                    <div key={partner.id} className={styles.logoItem}>
                        <img
                            src={partner.src}
                            alt={partner.alt}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

OurPartners.displayName = 'OurPartners';

export default OurPartners;
