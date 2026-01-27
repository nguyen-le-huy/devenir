import { z } from 'zod';

export const getOrdersSchema = z.object({
    query: z.object({
        page: z.string().transform(Number).or(z.number()).optional(),
        limit: z.string().transform(Number).or(z.number()).optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        sort: z.string().optional(),
        paymentMethod: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});

export const orderIdParamSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Order ID'),
    }),
});

export const updateOrderStatusSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Order ID'),
    }),
    body: z.object({
        status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
        trackingNumber: z.string().optional(),
        estimatedDelivery: z.string().optional(),
        deliveredAt: z.string().optional(),
        actualDeliveryTime: z.string().optional(),
    }),
});

export const getOrderStatsSchema = z.object({
    query: z.object({
        period: z.enum(['7d', '30d', '90d', 'ytd']).optional(),
    }),
});

export const exportOrdersSchema = z.object({
    body: z.object({
        fileType: z.enum(['csv', 'excel']).optional(),
        columns: z.array(z.string()).optional(),
        filters: z.record(z.any()).optional(),
        sorting: z.object({
            field: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional(),
        }).optional(),
        reportType: z.string().optional(),
    }),
});
