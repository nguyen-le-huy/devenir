import { z } from 'zod';

export const addToCartSchema = z.object({
    body: z.object({
        variantId: z.string().length(24, 'Invalid Variant ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
    }),
});

export const updateCartItemSchema = z.object({
    params: z.object({
        variantId: z.string().length(24, 'Invalid Variant ID'),
    }),
    body: z.object({
        quantity: z.number().int().min(0, 'Quantity cannot be negative'),
    }),
});

export const cartItemParamSchema = z.object({
    params: z.object({
        variantId: z.string().length(24, 'Invalid Variant ID'),
    }),
});
