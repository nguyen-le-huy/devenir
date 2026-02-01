import apiClient from '@/core/api/apiClient';

/**
 * Create NowPayments session for USDT BSC payment
 */
export const createNowPaymentsSession = async (payload: any) => {
    const response = await apiClient.post('/payments/nowpayments/session', payload);
    return response.data;
};

/**
 * Fetch NowPayments order status
 */
export const fetchNowPaymentsStatus = async (orderId: string) => {
    const response = await apiClient.get(`/payments/nowpayments/status/${orderId}`);
    return response.data;
};
