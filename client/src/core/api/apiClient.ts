import axios from 'axios';

// Lấy backend URL từ environment hoặc mặc định
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3111/api';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào request
apiClient.interceptors.request.use(
  (config) => {
    // Read token from Zustand persisted state (devenir-auth)
    try {
      const authState = localStorage.getItem('devenir-auth');
      if (authState) {
        const parsed = JSON.parse(authState);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // If parsing fails, try legacy token key
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Lỗi khi kết nối';
    const customError = new Error(message) as Error & { status?: number; data?: unknown };
    customError.status = error.response?.status;
    customError.data = error.response?.data;

    // Không tự động đăng xuất ở đây để tránh bị kick ra sau thanh toán; xử lý 401 tại flow gọi API
    return Promise.reject(customError);
  }
);

export default apiClient;
