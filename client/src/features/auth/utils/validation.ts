/**
 * Auth Feature Validation Utilities
 * Reusable validation functions for forms
 * 
 * @module auth/utils/validation
 */

export interface ValidationErrors {
    [key: string]: string;
}

/**
 * Validate password strength
 * Minimum 6 characters required
 * 
 * @param password - Password to validate
 * @returns Error message or null if valid
 * 
 * @example
 * ```ts
 * const error = validatePassword('12345');
 * if (error) console.error(error); // "Mật khẩu phải ít nhất 6 ký tự"
 * ```
 */
export const validatePassword = (password: string): string | null => {
    if (!password) {
        return 'Mật khẩu không được để trống';
    }
    
    if (password.length < 6) {
        return 'Mật khẩu phải ít nhất 6 ký tự';
    }
    
    return null;
};

/**
 * Validate password confirmation match
 * 
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Error message or null if passwords match
 * 
 * @example
 * ```ts
 * const error = validatePasswordMatch('123456', '123457');
 * if (error) console.error(error); // "Mật khẩu không khớp"
 * ```
 */
export const validatePasswordMatch = (
    password: string,
    confirmPassword: string
): string | null => {
    if (!confirmPassword) {
        return 'Vui lòng xác nhận mật khẩu';
    }
    
    if (password !== confirmPassword) {
        return 'Mật khẩu không khớp';
    }
    
    return null;
};

/**
 * Validate email format
 * Uses standard email regex pattern
 * 
 * @param email - Email address to validate
 * @returns Error message or null if valid
 * 
 * @example
 * ```ts
 * const error = validateEmail('invalid-email');
 * if (error) console.error(error); // "Email không hợp lệ"
 * ```
 */
export const validateEmail = (email: string): string | null => {
    if (!email) {
        return 'Email không được để trống';
    }
    
    // Standard email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Email không hợp lệ';
    }
    
    return null;
};

/**
 * Validate reset password form
 * Checks both password strength and confirmation match
 * 
 * @param data - Form data with newPassword and confirmPassword
 * @returns Object with field errors, empty if valid
 * 
 * @example
 * ```ts
 * const errors = validateResetPasswordForm({
 *     newPassword: '12345',
 *     confirmPassword: '123456'
 * });
 * // errors = { newPassword: "Mật khẩu phải ít nhất 6 ký tự", confirmPassword: "Mật khẩu không khớp" }
 * ```
 */
export const validateResetPasswordForm = (data: {
    newPassword: string;
    confirmPassword: string;
}): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    // Validate password strength
    const passwordError = validatePassword(data.newPassword);
    if (passwordError) {
        errors.newPassword = passwordError;
    }
    
    // Validate password match
    const matchError = validatePasswordMatch(data.newPassword, data.confirmPassword);
    if (matchError) {
        errors.confirmPassword = matchError;
    }
    
    return errors;
};

/**
 * Validate change password form
 * Includes current password validation
 * 
 * @param data - Form data with currentPassword, newPassword, confirmPassword
 * @returns Object with field errors, empty if valid
 */
export const validateChangePasswordForm = (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    // Validate current password exists
    if (!data.currentPassword) {
        errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    
    // Validate new password strength
    const passwordError = validatePassword(data.newPassword);
    if (passwordError) {
        errors.newPassword = passwordError;
    }
    
    // Validate password match
    const matchError = validatePasswordMatch(data.newPassword, data.confirmPassword);
    if (matchError) {
        errors.confirmPassword = matchError;
    }
    
    // Check if new password is different from current
    if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
        errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }
    
    return errors;
};
