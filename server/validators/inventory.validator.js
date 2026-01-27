import { z } from 'zod';

export const inventoryQuerySchema = z.object({
    query: z.object({
        page: z.string().transform(Number).or(z.number()).optional(),
        limit: z.string().transform(Number).or(z.number()).optional(),
        search: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        productStatus: z.string().optional(),
        stockStatus: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export const inventoryAdjustmentSchema = z.object({
    body: z.object({
        variantId: z.string().length(24, 'Invalid Variant ID'),
        operation: z.enum(['set', 'add', 'subtract']),
        quantity: z.number().min(1),
        reason: z.string().optional(),
        note: z.string().optional(),
        costPerUnit: z.number().optional(),
        sourceType: z.string().optional(),
        sourceRef: z.string().optional(),
        metadata: z.record(z.any()).optional(),
    }),
});

export const inventoryExportSchema = z.object({
    body: z.object({
        fileType: z.enum(['csv', 'excel']).optional(),
        columns: z.array(z.string()).optional(),
        filters: z.record(z.any()).optional(),
        sorting: z.object({
            field: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional()
        }).optional(),
        reportType: z.string().optional(),
    }),
});

export const variantIdParamSchema = z.object({
    params: z.object({
        variantId: z.string().length(24, 'Invalid Variant ID'),
    }),
});

export const adjustmentQuerySchema = z.object({
    query: z.object({
        page: z.string().transform(Number).or(z.number()).optional(),
        limit: z.string().transform(Number).or(z.number()).optional(),
        search: z.string().optional(),
        reason: z.string().optional(),
        sourceType: z.string().optional(),
        variantId: z.string().optional(),
        sku: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
    })
});
