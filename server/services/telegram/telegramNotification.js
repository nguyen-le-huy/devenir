import axios from 'axios';
import logger from '../../config/logger.js';

const N8N_WEBHOOK_URL = process.env.N8N_ORDER_NOTIFICATION_WEBHOOK;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ORDER_CHAT_ID;

/**
 * Send order notification to Telegram via n8n
 * @param {Object} order - Order document from MongoDB (populated with user)
 */
export async function sendOrderNotificationToTelegram(order) {
    if (!N8N_WEBHOOK_URL) {
        logger.warn('N8N_ORDER_NOTIFICATION_WEBHOOK not configured, skipping Telegram notification');
        return null;
    }

    try {
        const payload = {
            orderCode: order.paymentIntent?.gatewayOrderCode || order._id.toString(),
            totalPrice: order.totalPrice,
            shippingPrice: order.shippingPrice || 0,
            paymentGateway: order.paymentGateway || order.paymentMethod,
            customerEmail: order.user?.email || 'N/A',
            customerName: order.user?.username || order.user?.firstName || 'Khách hàng',
            shippingAddress: {
                street: order.shippingAddress?.street || '',
                city: order.shippingAddress?.city || '',
                postalCode: order.shippingAddress?.postalCode || '',
                phone: order.shippingAddress?.phone || ''
            },
            deliveryWindow: order.deliveryWindow,
            deliveryMethod: order.deliveryMethod,
            items: (order.orderItems || []).map(item => ({
                name: item.name,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                sku: item.sku
            })),
            telegramChatId: TELEGRAM_CHAT_ID,
            createdAt: order.createdAt || new Date().toISOString()
        };

        logger.info('Sending Telegram notification for order', {
            orderCode: payload.orderCode,
            webhookUrl: N8N_WEBHOOK_URL.substring(0, 50) + '...'
        });

        const response = await axios.post(N8N_WEBHOOK_URL, payload, {
            timeout: 15000,
            headers: { 'Content-Type': 'application/json' }
        });

        logger.info('Telegram notification sent successfully', {
            orderCode: payload.orderCode,
            response: response.data
        });

        return response.data;
    } catch (error) {
        logger.error('Failed to send Telegram notification', {
            orderCode: order.paymentIntent?.gatewayOrderCode || order._id,
            error: error.message,
            response: error.response?.data
        });
        // Don't throw - this is a non-critical operation
        return null;
    }
}
