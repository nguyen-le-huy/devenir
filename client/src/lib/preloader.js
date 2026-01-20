/**
 * Preloader State Management
 * Shared flag để sync giữa Preloader và Hero animation
 */

// Global flag - true khi preloader đã hoàn thành hoặc skip
let preloaderComplete = false;

// Callbacks đang đợi preloader complete
const callbacks = new Set();

/**
 * Mark preloader as complete và notify all listeners
 */
export const setPreloaderComplete = () => {
    preloaderComplete = true;
    // Notify all waiting callbacks
    callbacks.forEach(cb => cb());
    callbacks.clear();
};

/**
 * Check if preloader is complete
 */
export const isPreloaderComplete = () => preloaderComplete;

/**
 * Subscribe to preloader complete event
 * Nếu đã complete rồi, callback được gọi ngay lập tức
 * @param {Function} callback 
 * @returns {Function} unsubscribe function
 */
export const onPreloaderComplete = (callback) => {
    if (preloaderComplete) {
        // Đã complete rồi → gọi ngay
        callback();
        return () => {};
    }
    
    // Chưa complete → đợi
    callbacks.add(callback);
    return () => callbacks.delete(callback);
};

/**
 * Reset preloader state (for testing/development)
 */
export const resetPreloaderState = () => {
    preloaderComplete = false;
    callbacks.clear();
};
