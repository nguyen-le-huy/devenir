import { z } from 'zod';

export const customerIdParamSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Customer ID'),
    }),
});

export const createCustomerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6).optional(), // Optional if auto-generated or handled otherwise
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        customerProfile: z.object({
            status: z.enum(['prospect', 'active', 'inactive']).optional(),
            loyaltyTier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'vip']).optional(),
            notes: z.string().optional(),
            tags: z.array(z.string()).optional(),
        }).optional(),
        preferences: z.object({
            marketingOptIn: z.boolean().optional(),
        }).optional(),
        addresses: z.array(z.object({
            address: z.string(),
            city: z.string(),
            district: z.string(),
            zipCode: z.string(),
            isDefault: z.boolean().optional(),
        })).optional(),
    }),
});

export const updateCustomerSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Customer ID'),
    }),
    body: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        customerProfile: z.object({
            status: z.string().optional(),
            loyaltyTier: z.string().optional(),
            notes: z.string().optional(),
            tags: z.array(z.string()).optional(),
        }).optional(),
        preferences: z.any().optional(), // Flexible
        addresses: z.array(z.any()).optional(),
    }),
});

export const customerQuerySchema = z.object({
    query: z.object({
        page: z.string().transform(Number).or(z.number()).optional(),
        limit: z.string().transform(Number).or(z.number()).optional(),
        search: z.string().optional(),
        segment: z.string().optional(),
        tier: z.string().optional(),
        status: z.string().optional(),
        channel: z.string().optional(),
        tags: z.string().optional(),
        period: z.string().optional(),
        sort: z.string().optional(),
    })
});
