import { z } from 'zod';

export const createBrandSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Brand name is required'),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        tagline: z.string().optional(),
        originCountry: z.string().optional(),
        foundedYear: z.number().or(z.string().regex(/^\d+$/)).transform(val => Number(val)).optional(),
        website: z.string().url().optional().or(z.literal('')),
        isActive: z.boolean().optional(),
    }),
});

export const updateBrandSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Brand ID'),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        tagline: z.string().optional(),
        originCountry: z.string().optional(),
        foundedYear: z.number().or(z.string().regex(/^\d+$/)).transform(val => Number(val)).optional(),
        website: z.string().url().optional().or(z.literal('')),
        isActive: z.boolean().optional(),
    }),
});

export const brandIdSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Brand ID'),
    }),
});
