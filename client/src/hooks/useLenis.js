import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { setLenisInstance } from '../lib/lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Custom hook to initialize and manage Lenis smooth scroll
 * Automatically syncs with GSAP ScrollTrigger
 * 
 * @param {Object} options - Lenis configuration options
 * @returns {void}
 */
const useLenis = (options = {}) => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
            ...options,
        });

        // Store instance globally for external access
        setLenisInstance(lenis);

        // Sync Lenis with GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        // RAF loop callback
        const tickerCallback = (time) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(tickerCallback);
        gsap.ticker.lagSmoothing(0);

        // Cleanup
        return () => {
            setLenisInstance(null);
            lenis.destroy();
            gsap.ticker.remove(tickerCallback);
        };
    }, []);
};

export default useLenis;
