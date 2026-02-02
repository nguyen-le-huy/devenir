import Lenis from 'lenis';

/**
 * Lenis Smooth Scroll Instance
 * Shared across the application for smooth scrolling control
 */
export let lenisInstance: Lenis | null = null;

/**
 * Set the Lenis instance
 * @param {Lenis | null} instance - The Lenis instance or null to clear
 */
export const setLenisInstance = (instance: Lenis | null) => {
    lenisInstance = instance;
};
