import apiClient from '@/core/api/apiClient';
import { IOrder, IOrderFilters, IOrderListResponse } from '../types';

export const fetchMyOrders = async (params: IOrderFilters = {}): Promise<IOrderListResponse> => {
    const response = await apiClient.get<IOrderListResponse>('/orders/my', { params });
    return response.data;
}

export const fetchMyOrderDetail = async (orderId: string): Promise<IOrder> => {
    const response = await apiClient.get(`/orders/my/${orderId}`);
    return response.data;
}
