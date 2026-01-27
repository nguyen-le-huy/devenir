import { z } from 'zod';

export const shipmentIdParamSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Order/Shipment ID'),
    }),
});

export const startShipmentSchema = z.object({
    params: z.object({
        id: z.string().length(24, 'Invalid Order ID'),
    }),
    body: z.object({
        trackingNumber: z.string().optional(),
    }),
});

export const shipmentListSchema = z.object({
    query: z.object({
        status: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});
