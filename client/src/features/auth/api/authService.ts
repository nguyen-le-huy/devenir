import apiClient from '@/core/api/apiClient';
import {
    LoginData,
    RegisterData,
    AuthResponse,
    UserProfileData,
    ResetPasswordData,
    PhoneVerificationData,
    ChangePasswordData,
    User
} from '../types';

/**
 * Auth Service - Pure API calls for authentication
 * Following Service Layer pattern
 */
const authService = {
    /**
     * Register - Đăng ký tài khoản mới
     */
    register: (data: RegisterData): Promise<AuthResponse> => {
        return apiClient.post('/auth/register', data);
    },

    /**
     * Login - Đăng nhập truyền thống
     */
    login: (data: LoginData): Promise<AuthResponse> => {
        return apiClient.post('/auth/login', data);
    },

    /**
     * Google Login - Đăng nhập với Google OAuth
     */
    googleLogin: (credential: string): Promise<AuthResponse> => {
        return apiClient.post('/auth/google', { credential });
    },

    /**
     * Forgot Password - Yêu cầu reset password
     */
    forgotPassword: (data: { email: string }): Promise<void> => {
        return apiClient.post('/auth/forgot-password', data);
    },

    /**
     * Reset Password - Reset mật khẩu với token
     */
    resetPassword: (token: string, data: ResetPasswordData): Promise<void> => {
        return apiClient.post(`/auth/reset-password/${token}`, data);
    },

    /**
     * Verify Email - Xác nhận email
     */
    verifyEmail: (token: string): Promise<void> => {
        return apiClient.post(`/auth/verify-email/${token}`, {});
    },

    /**
     * Add Phone - Thêm số điện thoại
     */
    addPhone: (data: PhoneVerificationData): Promise<AuthResponse> => {
        return apiClient.post('/auth/add-phone', data);
    },

    /**
     * Update Profile - Cập nhật thông tin cá nhân
     */
    updateProfile: (data: UserProfileData): Promise<{ user: User }> => {
        return apiClient.put('/auth/profile', data);
    },

    /**
     * Change Password - Đổi mật khẩu
     */
    changePassword: (data: ChangePasswordData): Promise<void> => {
        return apiClient.post('/auth/change-password', data);
    },

    /**
     * Update Preferences - Cập nhật sở thích nhận thông báo
     */
    updatePreferences: (data: Partial<User["preferences"]>): Promise<{ user: User }> => {
        return apiClient.put('/auth/preferences', data);
    },

    /**
     * Logout - Đăng xuất
     */
    logout: async (): Promise<void> => {
        return apiClient.post('/auth/logout');
    },
};

export default authService;
