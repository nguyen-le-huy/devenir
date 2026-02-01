import { z } from 'zod';

export const calculateOrderProfitSchema = z.object({
    params: z.object({
        orderId: z.string().length(24, 'Invalid Order ID'),
    }),
});

export const revenueStatsSchema = z.object({
    query: z.object({
        startDate: z.string().transform(str => new Date(str)).refine(date => !isNaN(date.getTime()), { message: 'Invalid start date' }).optional(),
        endDate: z.string().transform(str => new Date(str)).refine(date => !isNaN(date.getTime()), { message: 'Invalid end date' }).optional(),
    }),
});
