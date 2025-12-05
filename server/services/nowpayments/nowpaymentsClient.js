/**
 * NowPayments API Client
 * Supports USDT BSC payments via NowPayments invoice API
 */

import crypto from 'crypto';

const getApiUrl = () => process.env.NOWPAYMENTS_SANDBOX === 'true'
    ? 'https://api-sandbox.nowpayments.io/v1'
    : 'https://api.nowpayments.io/v1';

const getApiKey = () => process.env.NOWPAYMENTS_API_KEY || '';
const getIpnSecret = () => process.env.NOWPAYMENTS_IPN_SECRET || '';

/**
 * Make API request to NowPayments
 */
const makeRequest = async (endpoint, options = {}) => {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const url = `${apiUrl}${endpoint}`;

    console.log('NowPayments API URL:', url);
    console.log('NowPayments API Key (first 8 chars):', apiKey.substring(0, 8));

    const response = await fetch(url, {
        ...options,
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('NowPayments API error:', data);
        throw new Error(data.message || `NowPayments API error: ${response.status}`);
    }

    return data;
};

/**
 * Get API status
 */
export const getStatus = async () => {
    return makeRequest('/status');
};

/**
 * Get minimum payment amount for a currency pair
 */
export const getMinimumAmount = async (currencyFrom, currencyTo = 'usdtbsc') => {
    return makeRequest(`/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`);
};

/**
 * Get estimated price for conversion
 */
export const getEstimatedPrice = async (amount, currencyFrom, currencyTo = 'usdtbsc') => {
    return makeRequest(`/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`);
};

/**
 * Create an invoice for payment
 * @param {Object} params Invoice parameters
 * @param {number} params.price_amount - Amount to pay in price_currency
 * @param {string} params.price_currency - Currency of the price (e.g., 'usd')
 * @param {string} params.pay_currency - Cryptocurrency to pay with (e.g., 'usdtbsc')
 * @param {string} params.order_id - Your internal order ID
 * @param {string} params.order_description - Order description
 * @param {string} params.ipn_callback_url - IPN callback URL
 * @param {string} params.success_url - Redirect URL after successful payment
 * @param {string} params.cancel_url - Redirect URL if payment is cancelled
 */
export const createInvoice = async (params) => {
    return makeRequest('/invoice', {
        method: 'POST',
        body: JSON.stringify({
            price_amount: params.price_amount,
            price_currency: params.price_currency || 'usd',
            pay_currency: params.pay_currency || 'usdtbsc',
            order_id: params.order_id,
            order_description: params.order_description,
            ipn_callback_url: params.ipn_callback_url,
            success_url: params.success_url,
            cancel_url: params.cancel_url,
        }),
    });
};

/**
 * Get payment status by payment ID
 */
export const getPaymentStatus = async (paymentId) => {
    return makeRequest(`/payment/${paymentId}`);
};

/**
 * Verify IPN callback signature
 * @param {Object} payload - The IPN payload
 * @param {string} signature - The x-nowpayments-sig header value
 */
export const verifyIPN = (payload, signature) => {
    const ipnSecret = getIpnSecret();
    if (!ipnSecret) {
        throw new Error('IPN secret not configured');
    }

    // Sort payload keys alphabetically and stringify
    const sortedPayload = Object.keys(payload)
        .sort()
        .reduce((acc, key) => {
            acc[key] = payload[key];
            return acc;
        }, {});

    const hmac = crypto
        .createHmac('sha512', ipnSecret)
        .update(JSON.stringify(sortedPayload))
        .digest('hex');

    return hmac === signature;
};

export default {
    getStatus,
    getMinimumAmount,
    getEstimatedPrice,
    createInvoice,
    getPaymentStatus,
    verifyIPN,
};
