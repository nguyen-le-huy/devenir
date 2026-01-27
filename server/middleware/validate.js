import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
    try {
        // Only validate what is defined in the schema
        // If schema has .strict(), it will reject unknown keys
        // If schema strips unknowns (default for objects unless strict() is called), it cleans data

        // We validate against a wrapper object { body, query, params }
        // But usually we want flexibility. 
        // Let's assume the user passes a schema that targets the specific part (mostly body)
        // Or we can enforce a structure.

        // Better pattern: The schema passed IS the schema for req.body usually.
        // But sometimes we validate query or params.

        // Let's standardise: The schema should be z.object({ body: ..., query: ..., params: ... }) 
        // OR allow passing specific partials.

        // To keep it simple for controllers, let's assume the input schema is for `req`.

        const requestSchema = schema;

        const parsedData = requestSchema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Optionally replace req.body with parsed (sanitized) data
        // For getters (Express 5/Node), use Object.assign or field update
        if (parsedData.body) req.body = parsedData.body; // Body is usually writable

        if (parsedData.query) {
            // req.query might be read-only property (getter), so mutate it
            for (const key in req.query) delete req.query[key];
            Object.assign(req.query, parsedData.query);
        }

        if (parsedData.params) {
            // req.params might also be read-only property
            try {
                req.params = parsedData.params;
            } catch (e) {
                // Fallback mutation
                for (const key in req.params) delete req.params[key];
                Object.assign(req.params, parsedData.params);
            }
        }

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Return first meaningful error message or a summary
            const firstError = error.errors[0];
            const message = firstError ? `${firstError.path.slice(1).join('.')}: ${firstError.message}` : 'Validation failed';

            return res.status(400).json({
                success: false,
                message: message,
                errors: error.errors.map(e => ({
                    path: e.path.slice(1).join('.'), // Remove 'body', 'query', etc from path
                    message: e.message,
                    code: e.code
                }))
            });
        }
        next(error);
    }
};
