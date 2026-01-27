import { z } from 'zod';

export const analyticsQuerySchema = z.object({
    query: z.object({
        days: z.string().or(z.number())
            .transform(val => parseInt(String(val), 10))
            .refine(val => !isNaN(val) && val > 0, { message: 'Days must be a positive number' })
            .optional()
            .default('7'),
        limit: z.string().or(z.number())
            .transform(val => parseInt(String(val), 10))
            .refine(val => !isNaN(val) && val > 0, { message: 'Limit must be a positive number' })
            .optional()
            .default('10'),
    }),
});
