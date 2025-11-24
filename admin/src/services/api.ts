import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const api = {
  get: (url: string, config?: AxiosRequestConfig) => axiosInstance.get(url, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.post(url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.put(url, data, config),
  patch: (url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.patch(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => axiosInstance.delete(url, config),
  request: (config: AxiosRequestConfig) => axiosInstance.request(config),
}

export default axiosInstance
