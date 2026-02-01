import apiClient from '@/core/api/apiClient';
import { IOrder, IOrderFilters } from '../types';

export const fetchMyOrders = async (params: IOrderFilters = {}): Promise<{ data: IOrder[], total: number, page: number, pages: number }> => {
    const response = await apiClient.get('/orders/my', { params });
    return response.data;
}

export const fetchMyOrderDetail = async (orderId: string): Promise<IOrder> => {
    const response = await apiClient.get(`/orders/my/${orderId}`);
    return response.data;
}
