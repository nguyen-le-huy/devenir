import apiClient from '@/core/api/apiClient';

export const fetchMyOrders = async (params: any = {}) => {
    const response = await apiClient.get('/orders/my', { params });
    return response.data;
}

export const fetchMyOrderDetail = async (orderId: string) => {
    const response = await apiClient.get(`/orders/my/${orderId}`);
    return response.data;
}
