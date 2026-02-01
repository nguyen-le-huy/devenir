import Order from '../models/OrderModel.js';
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';
import { upsertFinancialRecordForOrder } from '../controllers/FinancialController.js';
import logger from '../config/logger.js';

class ShipmentService {
    constructor() {
        this.MIN_DELIVERY_MINUTES = Number(process.env.SHIPMENT_MIN_MINUTES || 10);
        this.MAX_DELIVERY_MINUTES = Number(process.env.SHIPMENT_MAX_MINUTES || 10);
        this.shipmentTimers = new Map();
    }

    // --- Private Helpers ---

    _getRandomMinutes() {
        return Math.floor(Math.random() * (this.MAX_DELIVERY_MINUTES - this.MIN_DELIVERY_MINUTES + 1)) + this.MIN_DELIVERY_MINUTES;
    }

    _scheduleAutoDelivery(request, orderId, minutes) {
        if (this.shipmentTimers.has(String(orderId))) {
            clearTimeout(this.shipmentTimers.get(String(orderId)));
        }

        const timeout = setTimeout(async () => {
            try {
                const order = await Order.findById(orderId);
                if (!order || order.status !== 'shipped') return;

                await order.markAsDelivered();
                await upsertFinancialRecordForOrder({ orderId: order._id, status: 'confirmed' });

                emitRealtimeEvent(request, 'order:status-updated', {
                    orderId: order._id,
                    status: 'delivered',
                    deliveredAt: order.deliveredAt,
                    actualDeliveryTime: order.actualDeliveryTime,
                });
            } catch (error) {
                logger.error('Auto-delivery failed', { orderId, error: error.message });
            } finally {
                this.shipmentTimers.delete(String(orderId));
            }
        }, minutes * 60 * 1000);

        this.shipmentTimers.set(String(orderId), timeout);
    }

    // --- Public Methods ---

    async startShipment(orderId, trackingNumber, request) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.status !== 'paid') throw new Error('Order must be paid before shipping');

        const randomMinutes = this._getRandomMinutes();
        const estimatedDelivery = new Date(Date.now() + randomMinutes * 60 * 1000);

        await order.markAsShipped({ trackingNumber, estimatedDelivery });
        this._scheduleAutoDelivery(request, order._id, randomMinutes);

        emitRealtimeEvent(request, 'order:status-updated', {
            orderId: order._id,
            status: 'shipped',
            shippedAt: order.shippedAt,
            estimatedDelivery: order.estimatedDelivery,
            trackingNumber: order.trackingNumber,
        });

        return Order.findById(order._id).lean();
    }

    async markDelivered(orderId, request) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.status !== 'shipped') throw new Error('Order is not in shipped status');

        if (this.shipmentTimers.has(String(order._id))) {
            clearTimeout(this.shipmentTimers.get(String(order._id)));
            this.shipmentTimers.delete(String(order._id));
        }

        await order.markAsDelivered();
        await upsertFinancialRecordForOrder({ orderId: order._id, status: 'confirmed' });

        emitRealtimeEvent(request, 'order:status-updated', {
            orderId: order._id,
            status: 'delivered',
            deliveredAt: order.deliveredAt,
            actualDeliveryTime: order.actualDeliveryTime,
        });

        return Order.findById(order._id).lean();
    }

    async getShipmentsList(query) {
        const { status = 'shipped', startDate, endDate } = query;
        const dbQuery = { status: { $in: ['shipped', 'delivered'] } };

        if (status !== 'all') dbQuery.status = status;

        if (startDate || endDate) {
            dbQuery.shippedAt = {};
            if (startDate) dbQuery.shippedAt.$gte = new Date(startDate);
            if (endDate) dbQuery.shippedAt.$lte = new Date(endDate);
        }

        return Order.find(dbQuery)
            .select('user orderItems shippingAddress status shippedAt estimatedDelivery deliveredAt trackingNumber')
            .populate('user', 'firstName lastName username email phone')
            .lean();
    }

    async cancelShipment(orderId, request) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');

        if (this.shipmentTimers.has(String(order._id))) {
            clearTimeout(this.shipmentTimers.get(String(order._id)));
            this.shipmentTimers.delete(String(order._id));
        }

        await order.cancelOrder();

        emitRealtimeEvent(request, 'order:status-updated', {
            orderId: order._id,
            status: 'cancelled',
            cancelledAt: order.cancelledAt,
        });

        return true;
    }
}

export default new ShipmentService();
