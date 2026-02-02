import { useEffect } from 'react';
import Lenis, { LenisOptions } from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { setLenisInstance } from '@/core/lib/lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Custom hook to initialize and manage Lenis smooth scroll
 * Automatically syncs with GSAP ScrollTrigger
 * 
 * @param {LenisOptions} options - Lenis configuration options
 * @returns {void}
 */
const useLenis = (options: LenisOptions = {}): void => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
            ...options,
            smoothTouch: false, // Explicitly cast if needed or move to ...options if supported
        } as LenisOptions);

        // Store instance globally for external access
        setLenisInstance(lenis);

        // Sync Lenis with GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        // RAF loop callback
        const tickerCallback = (time: number) => {
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
    }, [options]);
};

export default useLenis;
