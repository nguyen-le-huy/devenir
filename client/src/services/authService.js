import apiClient from './api';

/**
 * Auth Service - API calls for authentication
 */
const authService = {
  /**
   * Register - Đăng ký tài khoản mới
   * @param {Object} data - {username, email, password}
   * @returns {Promise}
   */
  register: async (data) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login - Đăng nhập truyền thống
   * @param {Object} data - {email, password}
   * @returns {Promise}
   */
  login: async (data) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Google Login - Đăng nhập với Google OAuth
   * @param {String} credential - Google credential token
   * @returns {Promise}
   */
  googleLogin: async (credential) => {
    try {
      const response = await apiClient.post('/auth/google', { credential });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Forgot Password - Yêu cầu reset password
   * @param {Object} data - {email}
   * @returns {Promise}
   */
  forgotPassword: async (data) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset Password - Reset mật khẩu với token
   * @param {String} token - Reset token từ email
   * @param {Object} data - {newPassword}
   * @returns {Promise}
   */
  resetPassword: async (token, data) => {
    try {
      const response = await apiClient.post(`/auth/reset-password/${token}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify Email - Xác nhận email
   * @param {String} token - Verification token từ email
   * @returns {Promise}
   */
  verifyEmail: async (token) => {
    try {
      const response = await apiClient.post(`/auth/verify-email/${token}`, {});
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add Phone - Thêm số điện thoại
   * @param {Object} data - {phone, googleToken}
   * @returns {Promise}
   */
  addPhone: async (data) => {
    try {
      const response = await apiClient.post('/auth/add-phone', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update Profile - Cập nhật thông tin cá nhân
   * @param {Object} data - {username, phone, firstName, lastName, birthday}
   * @returns {Promise}
   */
  updateProfile: async (data) => {
    try {
      const response = await apiClient.put('/auth/profile', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change Password - Đổi mật khẩu
   * @param {Object} data - {currentPassword, newPassword}
   * @returns {Promise}
   */
  changePassword: async (data) => {
    try {
      const response = await apiClient.post('/auth/change-password', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update Preferences - Cập nhật sở thích nhận thông báo
   * @param {Object} data - {channels, interests}
   * @returns {Promise}
   */
  updatePreferences: async (data) => {
    try {
      const response = await apiClient.put('/auth/preferences', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout - Đăng xuất
   * @returns {Promise}
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
   * @returns {Object}
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
   * @returns {String}
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
   * @returns {Boolean}
   */
  isAuthenticated: () => {
    const token = authService.getToken();
    return !!token;
  },

  /**
   * Check if user is admin
   * @returns {Boolean}
   */
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  },
};

export default authService;
