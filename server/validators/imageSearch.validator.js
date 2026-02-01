import { z } from 'zod';

export const findSimilarSchema = z.object({
    body: z.object({
        image: z.string().min(1, 'Image is required'),
        topK: z.number().int().positive().optional().default(12),
        scoreThreshold: z.number().positive().max(1).optional().default(0.15),
    }),
});
