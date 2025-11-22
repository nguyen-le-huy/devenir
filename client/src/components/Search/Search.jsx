import styles from './Search.module.css';
import { useEffect, useRef } from 'react';
import { lenisInstance } from '../../App';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import { useLenisControl } from '../../hooks/useLenisControl';

const Search = ({ onClose }) => {
    const inputRef = useRef(null);
    const backdropRef = useRef(null);
    const searchContainerRef = useRef(null);
    const containerRef = useRef(null);
    const inputWrapperRef = useRef(null);
    const resultsRef = useRef(null);
    const headerHeight = useHeaderHeight(); // ✅ Sử dụng custom hook

    useLenisControl(true);

    // ✅ Sử dụng useGSAP cho animations
    useGSAP(() => {
        const timeline = gsap.timeline();

        // Animate backdrop opacity từ 0 -> 1
        timeline.fromTo(
            backdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: 'power2.out' }
        );

        // Animate search container height từ 0 -> auto
        timeline.fromTo(
            searchContainerRef.current,
            { height: 0 },
            {
                height: 'auto',
                duration: 0.5,
                ease: 'power3.out'
            },
            '<'
        );

        timeline.fromTo(
            [inputWrapperRef.current, resultsRef.current],
            { opacity: 0 },
            {
                opacity: 1,
                duration: 0.5,
                ease: 'power3.out'
            },
            '<'
        );

        // Focus vào input sau khi animation xong
        timeline.call(() => {
            inputRef.current?.focus();
        });
    }, { scope: containerRef });

    const handleClose = () => {
        // GSAP Animation khi đóng
        const timeline = gsap.timeline({
            onComplete: onClose
        });

        // Animate search container về height 0
        timeline.to(searchContainerRef.current, {
            height: 0,
            duration: 0.3,
            ease: 'power2.in'
        });

        // Animate backdrop về opacity 0
        timeline.to(
            backdropRef.current,
            { opacity: 0, duration: 0.3, ease: 'power2.in' },
            '<'
        );

        timeline.to(
            [inputWrapperRef.current, resultsRef.current],
            {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in'
            },
            '<'
        );

    };

    return (
        <div ref={containerRef}>
            <div
                ref={backdropRef}
                className={styles.backdrop}
                onClick={handleClose}
            ></div>

            <div
                ref={searchContainerRef}
                className={styles.searchContainer}
                style={{ top: `${headerHeight}px` }}
            >
                <div className={styles.inputWrapper} ref={inputWrapperRef}>
                    <input type="text" placeholder="Search" ref={inputRef} />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 22" fill="none">
                        <path d="M22.619 1.19043L32.1428 10.719L22.619 20.2452M1.19043 10.7214H32.1428" stroke="#0E0E0E" strokeWidth="2.38095" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className={styles.results} ref={resultsRef}>
                    <a className={styles.result} href="#">Wool Scarf</a>
                    <a className={styles.result} href="#">Devenir Scarf</a>
                    <a className={styles.result} href="#">Gucci Scarf</a>
                    <a className={styles.result} href="#">Devenir Scarf</a>
                    <a className={styles.result} href="#">Gucci Scarf</a>
                </div>
            </div>
        </div>
    );
}

export default Search;