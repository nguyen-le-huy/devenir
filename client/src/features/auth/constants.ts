/**
 * Auth Feature Constants
 * Centralized messages for i18n/consistency
 */
export const AUTH_MESSAGES = {
    // Success messages
    LOGIN_SUCCESS: 'Welcome back!',
    REGISTER_SUCCESS: 'Registration successful! Please check your email to verify your account.',
    REGISTER_SUCCESS_IMMEDIATE: 'Welcome!',
    LOGOUT_SUCCESS: 'Signed out successfully',
    PASSWORD_RESET_EMAIL_SENT: 'Password reset email has been sent!',
    PASSWORD_RESET_SUCCESS: 'Password reset successful! Please login.',
    PASSWORD_CHANGE_SUCCESS: 'Password changed successfully',
    EMAIL_VERIFIED: 'Email verified successfully',
    PHONE_VERIFIED: 'Phone verified successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PREFERENCES_UPDATED: 'Preferences updated',

    // Error messages
    LOGIN_FAILED: 'Login failed',
    REGISTER_FAILED: 'Registration failed',
    GOOGLE_LOGIN_FAILED: 'Google login failed',
    GOOGLE_REGISTER_FAILED: 'Google registration failed',
    PASSWORD_RESET_FAILED: 'Failed to reset password',
    PASSWORD_CHANGE_FAILED: 'Failed to change password',
    EMAIL_VERIFICATION_FAILED: 'Email verification failed. Please try again.',
    PHONE_VERIFICATION_FAILED: 'Phone verification failed',
    PROFILE_UPDATE_FAILED: 'Failed to update profile',
    PREFERENCES_UPDATE_FAILED: 'Failed to update preferences',
    FORGOT_PASSWORD_FAILED: 'Failed to send reset email',
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
