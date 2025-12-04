import apiClient from '../../services/api';

export const createPayOSPaymentSession = async (payload) => {
  const response = await apiClient.post('/payments/payos/session', payload);
  return response;
};

export const fetchPayOSOrderStatus = async (orderCode) => {
  const response = await apiClient.get(`/payments/payos/order/${orderCode}`);
  return response;
};
