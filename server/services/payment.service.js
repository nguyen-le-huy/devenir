import Order from '../models/OrderModel.js';
import Cart from '../models/CartModel.js';
import payosClient from './payos/payosClient.js';
import nowpaymentsClient from './nowpayments/nowpaymentsClient.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import { sendOrderNotificationToTelegram } from './telegram/telegramNotification.js';
import eventService from './event.service.js';
import logger from '../config/logger.js';

class PaymentService {
    constructor() {
        this.SHIPPING_FEES = { standard: 0, next: 5, nominated: 10 };
        this.DELIVERY_LABELS = { standard: 'Standard delivery', next: 'Next day delivery', nominated: 'Nominated day delivery' };
        this.PAYOS_DESCRIPTION_LIMIT = 25;
        this.VALID_GIFT_CODE = 'emanhhuy';
        this.GIFT_CODE_FIXED_PRICE_VND = 5000;
        this.GIFT_CODE_FIXED_PRICE_USDT = 0.1;
    }

    // --- Helpers ---

    _getShippingFee(deliveryWindow) {
        return this.SHIPPING_FEES[deliveryWindow] ?? 0;
    }

    _buildPayOSDescription(orderCode) {
        const base = `DN-${orderCode}`;
        return base.length > this.PAYOS_DESCRIPTION_LIMIT ? base.slice(0, this.PAYOS_DESCRIPTION_LIMIT) : base;
    }

    async _generateGatewayOrderCode() {
        let code;
        let exists = true;
        while (exists) {
            const timestampPart = Date.now().toString().slice(-10);
            const randomPart = Math.floor(100 + Math.random() * 900).toString();
            code = Number(`${timestampPart}${randomPart}`);
            exists = await Order.exists({ 'paymentIntent.gatewayOrderCode': code });
        }
        return code;
    }

    _buildOrderItems(cartItems) {
        return cartItems.map((item) => {
            const variant = item.productVariant;
            if (!variant) throw new Error('A variant in your cart is no longer available.');
            const product = variant.product_id;
            const fallbackImage = Array.isArray(variant.images) && variant.images.length > 0
                ? variant.images[0]
                : variant.mainImage || variant.hoverImage || (product?.images?.[0]?.url ?? '');

            return {
                name: product?.name || 'Devenir item',
                sku: variant.sku,
                color: variant.color,
                size: variant.size,
                quantity: item.quantity,
                price: variant.price,
                image: fallbackImage,
                mainImage: variant.mainImage || fallbackImage,
                hoverImage: variant.hoverImage || fallbackImage,
                productVariant: variant._id,
                product: product?._id,
            };
        });
    }

    async _clearCart(userId, orderId) {
        try {
            const cart = await Cart.findOne({ user: userId });
            if (cart) {
                cart.items = [];
                await cart.save();
            }
        } catch (error) {
            logger.error('Failed to clear cart', { error: error.message, orderId });
        }
    }

    async _handlePostPaymentSuccess(order) {
        // Clear cart
        await this._clearCart(order.user, order._id);

        // Send email
        if (!order.confirmationEmailSentAt) {
            try {
                await sendOrderConfirmationEmail({ email: order.user.email, order });
                order.confirmationEmailSentAt = new Date();
                await order.save();
            } catch (err) {
                logger.error('Failed to send confirmation email', { error: err.message, orderId: order._id });
            }
        }

        // Emit socket event (handled via controller typically, but we can expose method)
        // For services, better to return the order and let controller emit, OR pass io instance.
        // Keeping it simple: Controller handles socket emission based on return status.

        // Track event
        eventService.emit('purchase', {
            userId: order.user.toString(),
            data: {
                orderId: order._id.toString(),
                totalAmount: order.totalPrice,
                items: order.orderItems.map(item => ({
                    productId: item.product,
                    name: item.name,
                    category: 'unknown',
                    brand: 'unknown', // Optimized for speed, could populate if needed
                    color: item.color,
                    size: item.size,
                    price: item.price,
                    quantity: item.quantity
                }))
            }
        });

        // Telegram
        sendOrderNotificationToTelegram(order).catch(err =>
            logger.error('Telegram notification failed', { error: err.message, orderId: order._id })
        );

        return order;
    }

    // --- PayOS Logic ---

    async createPayOSSession({ user, userId, shippingMethod, deliveryTime, address, giftCode, clientBaseUrl }) {
        if (!['home'].includes(shippingMethod)) throw new Error('Currently only home delivery is supported for PayOS.');
        if (!Object.keys(this.SHIPPING_FEES).includes(deliveryTime)) throw new Error('Invalid delivery option.');

        const cart = await Cart.findOne({ user: userId }).populate({
            path: 'items.productVariant',
            populate: { path: 'product_id', select: 'name images brand' },
        });
        if (!cart?.items.length) throw new Error('Your cart is empty.');

        const orderItems = this._buildOrderItems(cart.items);
        const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
        const shippingFee = this._getShippingFee(deliveryTime);
        const totalPrice = Number((subtotal + shippingFee).toFixed(2));
        const isGiftCodeApplied = giftCode && giftCode.toLowerCase() === this.VALID_GIFT_CODE;

        const gatewayOrderCode = await this._generateGatewayOrderCode();
        const buyerName = `${address.firstName} ${address.lastName}`.trim();
        const buyerAddress = [address.address, address.district, address.city].filter(Boolean).join(', ');
        const streetLine = [address.address, address.district].filter(Boolean).join(', ');

        let orderDoc = await Order.create({
            user: userId,
            orderItems,
            shippingAddress: {
                street: streetLine,
                city: address.city,
                postalCode: String(address.zipCode),
                phone: String(address.phoneNumber),
            },
            deliveryMethod: shippingMethod,
            deliveryWindow: deliveryTime,
            paymentMethod: 'Bank',
            paymentGateway: 'PayOS',
            totalPrice: isGiftCodeApplied ? this.GIFT_CODE_FIXED_PRICE_VND : totalPrice,
            shippingPrice: isGiftCodeApplied ? 0 : shippingFee,
            appliedGiftCode: isGiftCodeApplied ? giftCode : null,
            status: 'pending',
        });

        try {
            const payosItems = orderItems.map(item => ({
                name: `${item.name} (${item.color}/${item.size})`,
                quantity: item.quantity,
                price: Math.round(item.price),
            }));
            if (shippingFee > 0) payosItems.push({ name: this.DELIVERY_LABELS[deliveryTime], quantity: 1, price: Math.round(shippingFee) });

            let payableAmount = isGiftCodeApplied ? this.GIFT_CODE_FIXED_PRICE_VND : payosItems.reduce((s, i) => s + i.price * i.quantity, 0);
            const finalPayosItems = isGiftCodeApplied ? [{ name: 'Gift Code Order', quantity: 1, price: this.GIFT_CODE_FIXED_PRICE_VND }] : payosItems;

            const paymentLink = await payosClient.paymentRequests.create({
                orderCode: gatewayOrderCode,
                amount: payableAmount,
                description: this._buildPayOSDescription(gatewayOrderCode),
                returnUrl: `${clientBaseUrl}/checkout/payos/success?orderCode=${gatewayOrderCode}`,
                cancelUrl: `${clientBaseUrl}/shipping?payment=cancelled`,
                buyerName,
                buyerEmail: user.email,
                buyerPhone: String(address.phoneNumber),
                buyerAddress,
                items: finalPayosItems,
                expiredAt: Math.floor(Date.now() / 1000) + 30 * 60,
            });

            orderDoc.paymentIntent = {
                gatewayOrderCode,
                paymentLinkId: paymentLink.paymentLinkId,
                checkoutUrl: paymentLink.checkoutUrl,
                qrCode: paymentLink.qrCode,
                amount: paymentLink.amount,
                currency: paymentLink.currency,
                rawResponse: paymentLink,
                status: paymentLink.status,
            };
            await orderDoc.save();

            return {
                checkoutUrl: paymentLink.checkoutUrl,
                qrCode: paymentLink.qrCode,
                orderCode: gatewayOrderCode,
                amount: paymentLink.amount,
                currency: paymentLink.currency,
                totalPrice,
                shippingFee,
                chargeAmount: payableAmount,
            };
        } catch (error) {
            await orderDoc.cancelOrder();
            await Order.findByIdAndDelete(orderDoc._id);
            throw error;
        }
    }

    async handlePayOSWebhook(body) {
        if (!body || !Object.keys(body).length) return { success: true, message: 'Ping' };
        if (body.code === 'test' || body.desc === 'test') return { success: true, message: 'Confirmed' };

        let verifiedData;
        try {
            verifiedData = await payosClient.webhooks.verify(body);
        } catch (e) {
            logger.warn('PayOS webhook verification failed', { error: e.message });
            return { success: true, message: 'Verification failed' };
        }

        const order = await Order.findOne({ 'paymentIntent.gatewayOrderCode': verifiedData.orderCode }).populate('user');
        if (!order) return { success: true, message: 'Order not found' };
        if (order.status === 'paid') return { success: true, message: 'Already processed' };

        if (verifiedData.code !== '00') {
            order.paymentIntent = { ...order.paymentIntent, status: 'FAILED', rawResponse: verifiedData };
            order.paymentResult = { id: verifiedData.paymentLinkId, status: 'failed', update_time: verifiedData.transactionDateTime, email_address: order.user?.email };
            await order.save();
            return { success: true, message: 'Marked failed' };
        }

        await order.markAsPaid({
            id: verifiedData.paymentLinkId,
            status: 'success',
            update_time: verifiedData.transactionDateTime,
            email_address: order.user?.email,
        });
        order.paymentIntent = { ...order.paymentIntent, status: 'PAID', amount: verifiedData.amount, rawResponse: verifiedData };
        await order.save();

        await this._handlePostPaymentSuccess(order);
        return { success: true, order };
    }

    // --- NowPayments Logic ---

    async createNowPaymentsSession({ user, userId, shippingMethod, deliveryTime, address, giftCode, clientBaseUrl, serverBaseUrl }) {
        if (!['home'].includes(shippingMethod)) throw new Error('Only home delivery supported.');

        const cart = await Cart.findOne({ user: userId }).populate({ path: 'items.productVariant', populate: { path: 'product_id' } });
        if (!cart?.items.length) throw new Error('Cart empty.');

        const orderItems = this._buildOrderItems(cart.items);
        const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
        const shippingFee = this._getShippingFee(deliveryTime);
        const totalPrice = Number((subtotal + shippingFee).toFixed(2));
        const isGiftCodeApplied = giftCode && giftCode.toLowerCase() === this.VALID_GIFT_CODE;
        const finalPrice = isGiftCodeApplied ? this.GIFT_CODE_FIXED_PRICE_USDT : totalPrice;

        const gatewayOrderCode = await this._generateGatewayOrderCode();
        const streetLine = [address.address, address.district].filter(Boolean).join(', ');

        let orderDoc = await Order.create({
            user: userId, orderItems,
            shippingAddress: { street: streetLine, city: address.city, postalCode: String(address.zipCode), phone: String(address.phoneNumber) },
            deliveryMethod: shippingMethod, deliveryWindow: deliveryTime,
            paymentMethod: 'Crypto', paymentGateway: 'NowPayments',
            totalPrice: finalPrice, shippingPrice: isGiftCodeApplied ? 0 : shippingFee,
            appliedGiftCode: isGiftCodeApplied ? giftCode : null, status: 'pending',
        });

        try {
            const invoice = await nowpaymentsClient.createInvoice({
                price_amount: finalPrice,
                price_currency: 'usd',
                pay_currency: 'usdtbsc',
                order_id: String(orderDoc._id),
                order_description: `Devenir Order #${gatewayOrderCode}`,
                ipn_callback_url: `${serverBaseUrl}/api/payments/nowpayments/webhook`,
                success_url: `${clientBaseUrl}/checkout/nowpayments/success?orderId=${orderDoc._id}`,
                cancel_url: `${clientBaseUrl}/shipping?payment=cancelled`,
            });

            orderDoc.paymentIntent = {
                gatewayOrderCode, paymentLinkId: invoice.id, checkoutUrl: invoice.invoice_url,
                amount: finalPrice, currency: 'USDT', rawResponse: invoice, status: 'PENDING',
            };
            await orderDoc.save();

            return {
                invoiceUrl: invoice.invoice_url, invoiceId: invoice.id, orderId: orderDoc._id,
                orderCode: gatewayOrderCode, amount: finalPrice, currency: 'USDT', payCurrency: 'USDTBSC',
            };
        } catch (error) {
            await orderDoc.cancelOrder();
            await Order.findByIdAndDelete(orderDoc._id);
            throw error;
        }
    }

    async handleNowPaymentsWebhook(body, signature) {
        if (!body || !Object.keys(body).length) return { success: true, message: 'Ping' };
        if (signature && !nowpaymentsClient.verifyIPN(body, signature)) return { success: true, message: 'Invalid signature' };

        const { order_id, payment_status } = body;
        if (!order_id) return { success: true, message: 'No order_id' };

        const order = await Order.findById(order_id).populate('user');
        if (!order) return { success: true, message: 'Order not found' };
        if (order.status === 'paid') return { success: true, message: 'Already processed' };

        order.paymentIntent = { ...order.paymentIntent, rawResponse: body, status: payment_status?.toUpperCase() || 'PENDING' };

        if (['finished', 'confirmed'].includes(payment_status)) {
            await order.markAsPaid({ id: order.paymentIntent?.paymentLinkId, status: 'success', update_time: new Date().toISOString(), email_address: order.user?.email });
            order.paymentIntent.status = 'PAID';
            await order.save();
            await this._handlePostPaymentSuccess(order);
            return { success: true, order };
        } else if (['failed', 'expired'].includes(payment_status)) {
            order.paymentIntent.status = 'FAILED';
            order.paymentResult = { id: order.paymentIntent?.paymentLinkId, status: 'failed', update_time: new Date().toISOString(), email_address: order.user?.email };
            await order.save();
            return { success: true, message: 'Failed' };
        }

        await order.save();
        return { success: true, message: 'Updated status' };
    }
}

export default new PaymentService();
