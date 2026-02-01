/**
 * User Validation Schemas
 * Zod schemas for form validation
 */

import { z } from 'zod';

/**
 * Vietnamese phone number regex
 * Supports: +84xxxxxxxxx or 0xxxxxxxxx (9-10 digits)
 */
const PHONE_REGEX = /^(\+84|0)[0-9]{9,10}$/;

/**
 * User Profile Update Schema
 */
export const userProfileSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(PHONE_REGEX, 'Invalid phone number format. Use +84 or 0 followed by 9-10 digits'),
  firstName: z
    .string()
    .max(50, 'First name must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  lastName: z
    .string()
    .max(50, 'Last name must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  birthday: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    ),
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must not exceed 128 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Preferences Schema
 */
export const userPreferencesSchema = z.object({
  channels: z.object({
    email: z.boolean(),
    phone: z.boolean(),
    messaging: z.boolean(),
    post: z.boolean(),
  }).optional(),
  interests: z.enum(['menswear', 'womenswear', 'both']).optional(),
});

/**
 * Type inference from schemas
 */
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;

/**
 * Validation functions
 */
export const validateUserProfile = (data: unknown) => {
  return userProfileSchema.safeParse(data);
};

export const validateChangePassword = (data: unknown) => {
  return changePasswordSchema.safeParse(data);
};

export const validateUserPreferences = (data: unknown) => {
  return userPreferencesSchema.safeParse(data);
};
