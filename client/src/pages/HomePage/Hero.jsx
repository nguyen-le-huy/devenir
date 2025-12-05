import styles from './Hero.module.css';
import gsap from 'gsap';
import SplitText from 'gsap/src/SplitText';
import { useGSAP } from '@gsap/react';
import { useRef, useEffect, useState } from 'react';
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(useGSAP, SplitText, DrawSVGPlugin);

const Hero = () => {
    const heroRef = useRef(null);
    const hasAnimated = useRef(false);
    const svgPathRef = useRef(null);
    const logoRef = useRef(null);
    const buttonRef = useRef(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    // ✅ Lắng nghe event từ Preloader
    useEffect(() => {
        const handlePreloaderComplete = () => {
            setShouldAnimate(true);
        };

        // Kiểm tra navigation type
        const navigationType = performance.getEntriesByType('navigation')[0]?.type;
        const isPageLoad = navigationType === 'reload' || navigationType === 'navigate';

        if (isPageLoad) {
            // Đợi event từ Preloader
            window.addEventListener('preloaderComplete', handlePreloaderComplete);
        } else {
            // Client-side navigation → Animate ngay
            setShouldAnimate(true);
        }

        return () => {
            window.removeEventListener('preloaderComplete', handlePreloaderComplete);
        };
    }, []);

    // Chạy animation
    useEffect(() => {
        if (!heroRef.current) return;

        // Nếu đã animate rồi, đảm bảo hiển thị
        if (hasAnimated.current) {
            const heroTexts = heroRef.current.querySelectorAll('.splitHero');
            gsap.set(heroTexts, { opacity: 1 });
            gsap.set(buttonRef.current, { opacity: 1, x: 0 });
            gsap.set(logoRef.current, { opacity: 1 });
            if (svgPathRef.current) {
                gsap.set(svgPathRef.current, { drawSVG: "100%", fill: 'white' });
            }
            return;
        }

        if (!shouldAnimate) return;

        document.fonts.ready.then(() => {
            const heroTexts = heroRef.current.querySelectorAll('.splitHero');

            // Set opacity 0 trước khi animate (thay vì dùng CSS)
            gsap.set(heroTexts, { opacity: 0 });
            gsap.set(buttonRef.current, { opacity: 0 });
            gsap.set(logoRef.current, { opacity: 0 });

            const tl = gsap.timeline();

            heroTexts.forEach((text, index) => {
                // Đảm bảo revert split text cũ nếu có
                if (text._split) text._split.revert();

                const split = new SplitText(text, {
                    type: "words,lines",
                    linesClass: "line",
                    autoSplit: true
                });

                // Lưu reference để cleanup nếu cần
                text._split = split;

                // Set opacity 1 cho container cha, nhưng animate các lines con
                gsap.set(text, { opacity: 1 });

                tl.from(split.lines, {
                    delay: 0.5,
                    duration: 0.8,
                    yPercent: 100,
                    opacity: 0,
                    stagger: 0.1,
                    ease: "power2.out",
                }, index * 0.2);
            });

            tl.from(buttonRef.current, {
                opacity: 0,
                x: 50,
                duration: 0.8,
                ease: "power2.inOut"
            }, '<');

            tl.to(logoRef.current, {
                opacity: 1,
                duration: 1,
            }, '<');

            tl.from(svgPathRef.current, {
                drawSVG: "0%",
                duration: 1,
                ease: "power3.in"
            }, '<');

            tl.to(svgPathRef.current, {
                fill: 'white',
                duration: 0.5,
                ease: 'power3.inOut'
            }, '-=0.5');

            hasAnimated.current = true;
        });
    }, [shouldAnimate]);

    return (
        <div ref={heroRef} className={`${styles.hero} container`}>
            <video
                className={styles.heroVideo}
                autoPlay
                loop
                muted
                playsInline
            >
                <source src="/videos/newBack.webm" type="video/webm" />
            </video>
            <div className={styles.content}>
                <div className={styles.firstRow}>
                    <h1 className="splitHero">UPGRADE</h1>
                </div>
                <div className={styles.secondRow}>
                    <h1 className="splitHero">YOUR STYLE</h1>
                </div>
                <div className={styles.thirdRow}>
                    <div className={styles.text}>
                        <h1 className="splitHero">WITH</h1>
                        <svg viewBox="0 0 408 68" fill="none" xmlns="http://www.w3.org/2000/svg" ref={logoRef}>
                            <path d="M45.9839 5.088C49.8879 7.84 52.9279 11.616 55.1039 16.416C57.2799 21.216 58.3679 26.656 58.3679 32.736C58.3679 38.816 57.2799 44.352 55.1039 49.344C52.9279 54.336 49.8879 58.24 45.9839 61.056C43.4879 62.848 40.6079 64.16 37.3439 64.992C34.1439 65.824 30.2079 66.24 25.5359 66.24H-8.76188e-05V65.472L7.87191 64.704V1.536L-8.76188e-05 0.768002V0H25.5359C34.2399 0 41.0559 1.696 45.9839 5.088ZM42.5279 59.424C44.5759 56.8 46.1759 53.088 47.3279 48.288C48.5439 43.424 49.1519 38.08 49.1519 32.256C49.1519 26.56 48.5759 21.536 47.4239 17.184C46.3359 12.832 44.7039 9.376 42.5279 6.816C40.7359 4.704 38.5279 3.232 35.9039 2.4C33.2799 1.568 29.5359 1.152 24.6719 1.152H15.2639V65.088H24.6719C29.7919 65.088 33.6319 64.672 36.1919 63.84C38.7519 63.008 40.8639 61.536 42.5279 59.424ZM116.377 46.08L113.977 66.24H66.9374V65.472L74.8094 64.704V1.536L66.9374 0.768002V0H114.073L115.417 18.048L114.457 18.144L109.081 4.704C108.505 3.232 107.865 2.272 107.161 1.82401C106.521 1.376 105.433 1.152 103.897 1.152H82.2014V30.624H96.4094C97.9454 30.624 99.0334 30.368 99.6734 29.856C100.313 29.344 100.761 28.352 101.017 26.88L102.649 19.104H103.801V43.68H102.649L101.017 35.904C100.761 34.432 100.313 33.44 99.6734 32.928C99.0334 32.416 97.9454 32.16 96.4094 32.16H82.2014V65.088H103.705C105.241 65.088 106.361 64.864 107.065 64.416C107.769 63.904 108.409 62.944 108.985 61.536L115.321 45.984L116.377 46.08ZM175.741 1.82401C175.293 1.504 174.557 1.312 173.533 1.248L167.677 0.768002V0H188.125V0.768002L182.749 1.248C181.149 1.376 179.997 1.696 179.293 2.208C178.653 2.656 178.077 3.616 177.565 5.088L154.045 67.776H152.317L128.029 1.536L120.157 0.768002V0H144.157V0.768002L135.805 1.536L156.157 57.12H156.541L176.029 5.088C176.285 4.448 176.413 3.84 176.413 3.264C176.413 2.624 176.189 2.144 175.741 1.82401ZM238.065 46.08L235.665 66.24H188.625V65.472L196.497 64.704V1.536L188.625 0.768002V0H235.761L237.105 18.048L236.145 18.144L230.769 4.704C230.193 3.232 229.553 2.272 228.849 1.82401C228.209 1.376 227.121 1.152 225.585 1.152H203.889V30.624H218.097C219.633 30.624 220.721 30.368 221.361 29.856C222.001 29.344 222.449 28.352 222.705 26.88L224.337 19.104H225.489V43.68H224.337L222.705 35.904C222.449 34.432 222.001 33.44 221.361 32.928C220.721 32.416 219.633 32.16 218.097 32.16H203.889V65.088H225.393C226.929 65.088 228.049 64.864 228.753 64.416C229.457 63.904 230.097 62.944 230.673 61.536L237.009 45.984L238.065 46.08ZM312.682 0V0.768002L305.77 1.536C304.234 1.728 303.21 2.112 302.698 2.688C302.186 3.264 301.93 4.32 301.93 5.856V67.776H300.97L257.866 6.624H257.482V60.384C257.482 61.92 257.674 63.008 258.058 63.648C258.442 64.224 259.21 64.576 260.362 64.704L267.178 65.472V66.24H246.154V65.472L253.066 64.704C254.218 64.576 254.986 64.224 255.37 63.648C255.754 63.008 255.946 61.92 255.946 60.384V4.512L255.562 3.936C254.666 2.656 253.802 1.824 252.97 1.44C252.202 0.992002 251.05 0.768002 249.514 0.768002H247.882V0H262.186L300.01 52.992H300.394V5.856C300.394 4.32 300.202 3.232 299.818 2.592C299.434 1.952 298.666 1.6 297.514 1.536L289.738 0.768002V0H312.682ZM318.094 0H341.23V0.768002L333.358 1.536V64.704L341.23 65.472V66.24H318.094V65.472L325.966 64.704V1.536L318.094 0.768002V0ZM407.209 65.472V66.24H397.321C395.785 66.24 394.633 66.016 393.865 65.568C393.097 65.12 392.297 64.256 391.465 62.976L376.777 39.264C375.881 37.792 375.113 36.896 374.473 36.576C373.897 36.192 372.841 36 371.305 36H364.201V64.704L372.553 65.472V66.24H348.937V65.472L356.809 64.704V1.536L348.937 0.768002V0H373.225C380.777 0 386.537 1.536 390.505 4.608C394.473 7.616 396.457 12 396.457 17.76C396.457 22.24 395.241 25.92 392.809 28.8C390.377 31.68 386.857 33.664 382.249 34.752H382.345L399.913 62.208C400.745 63.488 401.545 64.352 402.313 64.8C403.145 65.248 404.329 65.472 405.865 65.472H407.209ZM364.201 1.152V34.56H372.937C378.057 34.56 381.833 33.216 384.265 30.528C386.761 27.776 388.009 23.584 388.009 17.952C388.009 12.256 386.761 8.032 384.265 5.28C381.769 2.528 377.993 1.152 372.937 1.152H364.201Z" fill="white" ref={svgPathRef} />
                        </svg>
                    </div>
                    <button ref={buttonRef} className={styles.shopButton}>
                        <span>SHOP NOW</span>
                        <div className={styles.marquee} aria-hidden="true">
                            <div className={styles.marqueeInner}>
                                <span>SHOP NOW</span>
                                <span>SHOP NOW</span>
                                <span>SHOP NOW</span>
                                <span>SHOP NOW</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Hero;