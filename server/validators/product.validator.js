import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Product name is required'),
        description: z.string().min(1, 'Description is required'),
        category: z.string().min(1, 'Category is required'), // ID string
        brand: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'published', 'hidden']).optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        urlSlug: z.string().optional(),
        variants: z.array(z.object({
            sku: z.string().min(1),
            color: z.string().min(1),
            size: z.string().min(1),
            price: z.number().min(0),
            quantity: z.number().min(0).optional(),
            mainImage: z.string().optional(),
            hoverImage: z.string().optional(),
            images: z.array(z.string()).optional(),
        })).optional(),
    }),
});

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Product ID'),
    }),
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'published', 'hidden']).optional(),
        variants: z.array(z.any()).optional(), // Loose validation for variants updates for now
    }),
});

export const createVariantSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Product ID'),
    }),
    body: z.object({
        sku: z.string().min(1),
        size: z.string().min(1),
        color: z.string().min(1),
        price: z.number().optional(),
        stock: z.number().optional(),
        images: z.array(z.string()).optional(),
    }),
});

export const updateVariantSchema = z.object({
    params: z.object({
        skuOrId: z.string().min(1),
    }),
    body: z.object({
        price: z.number().optional(),
        stock: z.number().optional(),
        quantity: z.number().optional(), // legacy
        sku: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        mainImage: z.string().optional(),
        syncColorGroup: z.boolean().optional(),
        // ... other fields
    }),
});

export const bulkUpdateVariantsSchema = z.object({
    body: z.object({
        skus: z.array(z.string()).min(1),
        operation: z.enum(['set', 'add', 'subtract']),
        amount: z.number(),
        field: z.enum(['quantity', 'price']).optional(),
    }),
});
