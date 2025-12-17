import apiClient from './api'

export const fetchMyOrders = async (params = {}) => {
  return apiClient.get('/orders/my', { params })
}

export const fetchMyOrderDetail = async (orderId) => {
  return apiClient.get(`/orders/my/${orderId}`)
}
