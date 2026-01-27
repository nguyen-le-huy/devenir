import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        email: z.string().email('Invalid email address'),
        phone: z.string().regex(/^[0-9+]+$/, 'Invalid phone number'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const googleLoginSchema = z.object({
    body: z.object({
        credential: z.string().min(1, 'Google credential is required'),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

export const resetPasswordSchema = z.object({
    params: z.object({
        token: z.string().min(1),
    }),
    body: z.object({
        newPassword: z.string().min(6),
    }),
});

export const verifyEmailSchema = z.object({
    params: z.object({
        token: z.string().min(1),
    }),
});

export const addPhoneSchema = z.object({
    body: z.object({
        phone: z.string().regex(/^(\+84|0)[0-9]{9,10}$/, 'Invalid phone format'),
        googleToken: z.string().optional(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        birthday: z.string().optional(), // Could add date validation
        avatar: z.string().optional(),
    }),
});

export const shippingAddressSchema = z.object({
    body: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        district: z.string().min(1),
        zipCode: z.string().min(1),
        isDefault: z.boolean().optional(),
    }),
});
