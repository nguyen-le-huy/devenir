import { z } from 'zod';

export const trackEventSchema = z.object({
    body: z.object({
        events: z.array(z.object({
            type: z.string().min(1, 'Event type is required'),
            data: z.record(z.any()).optional(),
            timestamp: z.string().or(z.number()).or(z.date()).optional(),
            sessionId: z.string().optional(),
            page: z.string().optional(),
            referrer: z.string().optional(),
        })).min(1, 'Events array is required'),
        userId: z.string().optional(), // Can pass explicit userId if authenticated by different means
    }),
});


export const singleEventSchema = z.object({
    body: z.object({
        type: z.string().min(1),
        data: z.record(z.any()).optional(),
        timestamp: z.string().or(z.number()).or(z.date()).optional(),
        token: z.string().optional(),
    }),
});

export const userStatsSchema = z.object({
    params: z.object({
        userId: z.string().length(24, 'Invalid User ID'),
    }),
    query: z.object({
        days: z.string().or(z.number())
            .transform(val => parseInt(String(val), 10))
            .refine(val => !isNaN(val) && val > 0, { message: 'Days must be a positive number' })
            .optional()
            .default('30'),
    }),
});
