import { z } from 'zod';

export const colorIdParamSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Color ID'),
    }),
});

export const createColorSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Color name is required'),
        hex: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid HEX color code'),
    }),
});

export const updateColorSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Color ID'),
    }),
    body: z.object({
        name: z.string().optional(),
        hex: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid HEX color code').optional(),
        isActive: z.boolean().optional(),
    }),
});
