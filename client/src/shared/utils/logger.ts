/**
 * Logger utility for centralized logging
 * Development: Logs to console
 * Production: Can be extended to send to monitoring services (Sentry, Datadog, etc.)
 */

const isDevelopment = import.meta.env.DEV;

interface LogContext {
    [key: string]: unknown;
}

/**
 * Centralized logger with environment-aware behavior
 */
export const logger = {
    /**
     * Log informational messages (dev only)
     */
    info: (message: string, context?: LogContext): void => {
        if (isDevelopment) {
            console.info(`[INFO] ${message}`, context ?? '');
        }
    },

    /**
     * Log warning messages (dev only)
     */
    warn: (message: string, context?: LogContext): void => {
        if (isDevelopment) {
            console.warn(`[WARN] ${message}`, context ?? '');
        }
    },

    /**
     * Log error messages
     * In production, this could send to a monitoring service
     */
    error: (message: string, error?: unknown, context?: LogContext): void => {
        if (isDevelopment) {
            console.error(`[ERROR] ${message}`, error, context ?? '');
        }
        // Production: Send to monitoring service
        // Example: Sentry.captureException(error, { extra: { message, ...context } });
    },

    /**
     * Log debug messages (dev only)
     */
    debug: (message: string, context?: LogContext): void => {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, context ?? '');
        }
    },
};

export default logger;
