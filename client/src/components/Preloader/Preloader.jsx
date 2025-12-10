import styles from './Preloader.module.css';
import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { lenisInstance } from '../../App.jsx';

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

const Preloader = () => {
    const [shouldShowPreloader, setShouldShowPreloader] = useState(false);

    const containerRef = useRef(null);
    const firstNumberRef = useRef(null);
    const secondNumberRef = useRef(null);
    const logoRef = useRef(null);
    const pathsRef = useRef([]);
    const circleLoaderRef = useRef(null);

    // ✅ Chỉ show preloader khi truy cập trực tiếp qua URL (không phải client-side navigation)
    useEffect(() => {
        // Kiểm tra xem đã navigate trong app chưa
        const hasNavigated = sessionStorage.getItem('hasNavigated');

        if (!hasNavigated) {
            // Lần đầu tiên load trang (truy cập qua URL/link) → Show preloader
            setShouldShowPreloader(true);
            // Đánh dấu là đã vào app
            sessionStorage.setItem('hasNavigated', 'true');
        } else {
            // Đã navigate trong app rồi → Skip preloader
            setShouldShowPreloader(false);
            // ✅ Dispatch event ngay lập tức để Hero animation chạy
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('preloaderComplete'));
            }, 0);
        }
    }, []);

    // Lock scroll khi preloader hiển thị
    useEffect(() => {
        if (!shouldShowPreloader) return;

        const scrollY = window.scrollY;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo(0, scrollY);
        };
    }, [shouldShowPreloader]);

    useGSAP(() => {
        if (!shouldShowPreloader) return;

        if (lenisInstance) {
            lenisInstance.stop();
        }

        const container = containerRef.current;
        const firstNum = firstNumberRef.current;
        const secondNum = secondNumberRef.current;
        const logo = logoRef.current;
        const paths = pathsRef.current;
        const circleLoader = circleLoaderRef.current;

        const tl = gsap.timeline();

        // Speed up by 50%: slideDuration 0.3 → 0.15, delays 0.4 → 0.2
        const slideDuration = 0.15;
        const slideEase = "power2.inOut";
        const slideEaseOut = "power2.in";

        tl.set([firstNum, secondNum], { yPercent: 0 });

        // Change to 25
        tl.to(firstNum, { yPercent: -100, duration: slideDuration, ease: slideEaseOut }, '+=0.2')
            .to(secondNum, { yPercent: -100, duration: slideDuration, ease: slideEaseOut }, '-=0.1')
            .set(firstNum, { innerText: '2', yPercent: 100 })
            .set(secondNum, { innerText: '5', yPercent: 100 })
            .to(firstNum, { yPercent: 0, duration: slideDuration, ease: slideEase })
            .to(secondNum, { yPercent: 0, duration: slideDuration, ease: slideEase }, '-=0.1');

        // Change to 67
        tl.to(firstNum, { y: '-100%', duration: slideDuration, ease: slideEaseOut }, '+=0.2')
            .to(secondNum, { y: '-100%', duration: slideDuration, ease: slideEaseOut }, '-=0.1')
            .set(firstNum, { innerText: '6', y: '100%' })
            .set(secondNum, { innerText: '7', y: '100%' })
            .to(firstNum, { y: '0%', duration: slideDuration, ease: slideEase })
            .to(secondNum, { y: '0%', duration: slideDuration, ease: slideEase }, '-=0.1');

        // Change to 98
        tl.to(firstNum, { y: '-100%', duration: slideDuration, ease: slideEaseOut }, '+=0.2')
            .to(secondNum, { y: '-100%', duration: slideDuration, ease: slideEaseOut }, '-=0.1')
            .set(firstNum, { innerText: '9', y: '100%' })
            .set(secondNum, { innerText: '8', y: '100%' })
            .to(firstNum, { y: '0%', duration: slideDuration, ease: slideEase })
            .to(secondNum, { y: '0%', duration: slideDuration, ease: slideEase }, '-=0.1');

        // Change to 99
        tl.to(secondNum, { y: '-100%', duration: slideDuration, ease: slideEaseOut }, '+=0.2')
            .set(secondNum, { innerText: '9', y: '100%' })
            .to(secondNum, { y: '0%', duration: slideDuration, ease: slideEase });

        // Fade out numbers
        tl.to([firstNum, secondNum, circleLoader], {
            opacity: 0,
            duration: 0.3,
            ease: "power1.in",
            delay: 0.25
        });

        // Logo animation
        tl.to(logo, {
            opacity: 1,
            duration: 0.5,
        }, '<');

        tl.from(paths, {
            drawSVG: "0%",
            duration: 1.5,
            ease: 'power2.inOut',
            stagger: 0.1
        });

        tl.to(paths, {
            fill: 'white',
            duration: 0.5,
            ease: 'power1.inOut'
        }, '-=0.5');

        // Slide up
        tl.to(container, {
            yPercent: -100,
            duration: 1.2,
            ease: 'power3.inOut',
            delay: 0.5
        });

        // Unlock scroll & dispatch event
        tl.call(() => {
            const scrollY = parseInt(document.body.style.top || '0') * -1;

            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            window.scrollTo(0, scrollY);

            if (lenisInstance) {
                lenisInstance.start();
            }

            window.dispatchEvent(new CustomEvent('preloaderComplete'));
        }, null, '-=0.5');

        tl.set(container, {
            display: 'none',
        });
    }, { scope: containerRef, dependencies: [shouldShowPreloader] });

    if (!shouldShowPreloader) return null;

    return (
        <div className={styles.preloader} ref={containerRef}>
            <div className={styles.loaderNumberWrapper}>
                <span className={styles.firstLoaderNumber} ref={firstNumberRef}>0</span>
                <span className={styles.secondLoaderNumber} ref={secondNumberRef}>0</span>
            </div>
            <svg ref={logoRef} className={styles.loaderLogo} width="122" height="227" viewBox="0 0 122 227" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path ref={(e) => (pathsRef.current[0] = e)} d="M66.432 42.464C71.6373 46.1333 75.6907 51.168 78.592 57.568C81.4933 63.968 82.944 71.2213 82.944 79.328C82.944 87.4347 81.4933 94.816 78.592 101.472C75.6907 108.128 71.6373 113.333 66.432 117.088C63.104 119.477 59.264 121.227 54.912 122.336C50.6453 123.445 45.3973 124 39.168 124H5.12V122.976L15.616 121.952V37.728L5.12 36.704V35.68H39.168C50.7733 35.68 59.8613 37.9413 66.432 42.464ZM61.824 114.912C64.5547 111.413 66.688 106.464 68.224 100.064C69.8453 93.5787 70.656 86.4533 70.656 78.688C70.656 71.0933 69.888 64.3947 68.352 58.592C66.9013 52.7893 64.7253 48.1813 61.824 44.768C59.4347 41.952 56.4907 39.9893 52.992 38.88C49.4933 37.7707 44.5013 37.216 38.016 37.216H25.472V122.464H38.016C44.8427 122.464 49.9627 121.909 53.376 120.8C56.7893 119.691 59.6053 117.728 61.824 114.912Z" />
                <path ref={(e) => (pathsRef.current[1] = e)} d="M105.192 107.112C104.595 106.685 103.613 106.429 102.248 106.344L94.44 105.704V104.68H121.704V105.704L114.536 106.344C112.403 106.515 110.867 106.941 109.928 107.624C109.075 108.221 108.307 109.501 107.624 111.464L76.264 195.048H73.96L41.576 106.728L31.08 105.704V104.68H63.08V105.704L51.944 106.728L79.08 180.84H79.592L105.576 111.464C105.917 110.611 106.088 109.8 106.088 109.032C106.088 108.179 105.789 107.539 105.192 107.112Z" />
            </svg>
            <div className={styles.loaderCircle} ref={circleLoaderRef}></div>
        </div>
    );
}

export default Preloader;