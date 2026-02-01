import apiClient from '@/core/api/apiClient';

export const createPayOSPaymentSession = async (payload: any) => {
    const response = await apiClient.post('/payments/payos/session', payload);
    return response.data;
};

export const fetchPayOSOrderStatus = async (orderCode: string) => {
    const response = await apiClient.get(`/payments/payos/order/${orderCode}`);
    return response.data;
};
