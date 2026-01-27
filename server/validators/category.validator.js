import { z } from 'zod';

export const categoryIdParamSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Category ID'),
    }),
});

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Category name is required'),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        slug: z.string().optional(),
        sortOrder: z.number().int().optional(),
        parentCategory: z.string().length(24, 'Invalid Parent Category ID').nullable().optional(),
        isActive: z.boolean().optional(),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Category ID'),
    }),
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        slug: z.string().optional(),
        sortOrder: z.number().int().optional(),
        level: z.number().int().optional(), // Allow manual level override if needed, though service calculates it
        parentCategory: z.string().length(24, 'Invalid Parent Category ID').nullable().optional(),
        isActive: z.boolean().optional(),
    }),
});
