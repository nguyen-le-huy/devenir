/**
 * Preloader State Management
 * Shared flag to sync between Preloader and Hero animation
 */

// Global flag - true when preloader is complete or skipped
let preloaderComplete = false;

// Callbacks waiting for preloader complete
const callbacks = new Set<() => void>();

/**
 * Mark preloader as complete and notify all listeners
 */
export const setPreloaderComplete = (): void => {
    preloaderComplete = true;
    // Notify all waiting callbacks
    callbacks.forEach(cb => cb());
    callbacks.clear();
};

/**
 * Check if preloader is complete
 */
export const isPreloaderComplete = (): boolean => preloaderComplete;

/**
 * Subscribe to preloader complete event
 * If already complete, callback is called immediately
 * @param {Function} callback 
 * @returns {Function} unsubscribe function
 */
export const onPreloaderComplete = (callback: () => void): () => void => {
    if (preloaderComplete) {
        // Already complete -> call immediately
        callback();
        return () => { };
    }

    // Not complete -> wait
    callbacks.add(callback);
    return () => callbacks.delete(callback);
};

/**
 * Reset preloader state (for testing/development)
 */
export const resetPreloaderState = (): void => {
    preloaderComplete = false;
    callbacks.clear();
};
