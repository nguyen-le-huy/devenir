import { z } from 'zod';

const addressSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phoneNumber: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    zipCode: z.string().or(z.number()),
});

export const createSessionSchema = z.object({
    body: z.object({
        shippingMethod: z.string(),
        deliveryTime: z.string(),
        address: addressSchema,
        giftCode: z.string().optional(),
    }),
});

export const payosOrderCodeSchema = z.object({
    params: z.object({
        orderCode: z.string().or(z.number()),
    }),
});

export const nowPaymentsOrderIdSchema = z.object({
    params: z.object({
        orderId: z.string().length(24, 'Invalid Order ID'),
    }),
});

// Webhooks typically don't need strict schema validation in the same way as client requests
// because they come from trusted providers and might vary, but we can check basics if needed.
// For now, we will rely on signature verification in the service.
