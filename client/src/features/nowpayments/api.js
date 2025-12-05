import apiClient from '../../services/api';

/**
 * Create NowPayments session for USDT BSC payment
 */
export const createNowPaymentsSession = async (payload) => {
    const response = await apiClient.post('/payments/nowpayments/session', payload);
    return response;
};

/**
 * Fetch NowPayments order status
 */
export const fetchNowPaymentsStatus = async (orderId) => {
    const response = await apiClient.get(`/payments/nowpayments/status/${orderId}`);
    return response;
};
