import logger from '../config/logger.js';

/**
 * Middleware to sanitize inputs against NoSQL Injection
 * Recursively removes any keys starting with '$' or containing '.' from req.body, req.query, and req.params
 */
export const mongoSanitize = () => {
    return (req, res, next) => {
        const sanitize = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            for (const key in obj) {
                if (key.startsWith('$') || key.includes('.')) {
                    logger.warn(`Potential NoSQL Injection detected: ${key}`, {
                        ip: req.ip,
                        path: req.path,
                        key
                    });
                    delete obj[key];
                } else {
                    sanitize(obj[key]);
                }
            }
        };

        try {
            if (req.body) sanitize(req.body);
            if (req.params) sanitize(req.params);
            if (req.query) sanitize(req.query);
        } catch (error) {
            logger.error('Error during mongo sanitization', { error: error.message });
        }

        next();
    };
};
