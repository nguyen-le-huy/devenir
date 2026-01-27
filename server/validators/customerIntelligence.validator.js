import { z } from 'zod';

export const customerIntelligenceParamSchema = z.object({
    params: z.object({
        userId: z.string().length(24, 'Invalid User ID'),
    }),
});

export const intelligenceQuerySchema = z.object({
    query: z.object({
        days: z.string().or(z.number())
            .transform(val => parseInt(String(val), 10))
            .refine(val => !isNaN(val) && val > 0, { message: 'Days must be a positive number' })
            .optional()
            .default('30'),
    }),
});

export const applyTagsSchema = z.object({
    params: z.object({
        userId: z.string().length(24, 'Invalid User ID'),
    }),
    body: z.object({
        tags: z.array(z.string()).min(1, 'Tags array is required'),
    }),
});

export const applyNotesSchema = z.object({
    params: z.object({
        userId: z.string().length(24, 'Invalid User ID'),
    }),
    body: z.object({
        notes: z.array(z.object({
            type: z.string().optional(),
            content: z.string(),
            priority: z.enum(['low', 'medium', 'high']).optional(),
        })).min(1, 'Notes array is required'),
    }),
});
