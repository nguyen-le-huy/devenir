/**
 * Lenis Smooth Scroll Instance
 * Shared across the application for smooth scrolling control
 */
export let lenisInstance = null;

/**
 * Set the Lenis instance
 * @param {Lenis} instance - The Lenis instance
 */
export const setLenisInstance = (instance) => {
  lenisInstance = instance;
};
