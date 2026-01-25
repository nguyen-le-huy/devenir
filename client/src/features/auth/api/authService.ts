import apiClient from '@/core/api/apiClient';

// Helper type for Auth Service
// Adjust types as needed based on backend response
interface RegisterData {
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
}

interface LoginData {
    email?: string;
    password?: string;
}

interface UserProfileData {
    username?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    birthday?: string;
}

/**
 * Auth Service - API calls for authentication
 * All methods return Promises and let errors propagate to callers
 */
const authService = {
    /**
     * Register - Đăng ký tài khoản mới
     */
    register: (data: RegisterData) => apiClient.post('/auth/register', data) as Promise<{ user: any; token: string }>,

    /**
     * Login - Đăng nhập truyền thống
     */
    login: (data: LoginData) => apiClient.post('/auth/login', data) as Promise<{ user: any; token: string }>,

    /**
     * Google Login - Đăng nhập với Google OAuth
     */
    googleLogin: (credential: string | undefined) => apiClient.post('/auth/google', { credential }) as Promise<{ user: any; token: string }>,

    /**
     * Forgot Password - Yêu cầu reset password
     */
    forgotPassword: (data: { email: string }) => apiClient.post('/auth/forgot-password', data),

    /**
     * Reset Password - Reset mật khẩu với token
     */
    resetPassword: (token: string, data: { newPassword: string }) => apiClient.post(`/auth/reset-password/${token}`, data),

    /**
     * Verify Email - Xác nhận email
     */
    verifyEmail: (token: string) => apiClient.post(`/auth/verify-email/${token}`, {}),

    /**
     * Add Phone - Thêm số điện thoại
     */
    addPhone: (data: { phone: string; googleToken: string | null }) => apiClient.post('/auth/add-phone', data) as Promise<{ user: any; token: string }>,

    /**
     * Update Profile - Cập nhật thông tin cá nhân
     */
    updateProfile: (data: UserProfileData) => apiClient.put('/auth/profile', data) as Promise<{ user: any }>,

    /**
     * Change Password - Đổi mật khẩu
     */
    changePassword: (data: any) => apiClient.post('/auth/change-password', data),

    /**
     * Update Preferences - Cập nhật sở thích nhận thông báo
     */
    updatePreferences: (data: { channels?: any; interests?: any }) => apiClient.put('/auth/preferences', data),

    /**
     * Logout - Đăng xuất
     */
    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (error) {
            // Vẫn xóa localStorage dù API error
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw error;
        }
    },

    /**
     * Get current user info
     */
    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            return null;
        }
    },

    /**
     * Get token
     */
    getToken: () => {
        try {
            const authState = localStorage.getItem('devenir-auth');
            if (authState) {
                const parsed = JSON.parse(authState);
                if (parsed?.state?.token) return parsed.state.token;
            }
        } catch (e) { }
        return localStorage.getItem('token');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        const token = authService.getToken();
        return !!token;
    },

    /**
     * Check if user is admin
     */
    isAdmin: () => {
        const user = authService.getCurrentUser();
        return user?.role === 'admin';
    },
};

export default authService;
