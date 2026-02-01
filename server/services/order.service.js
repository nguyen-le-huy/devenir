import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import { upsertFinancialRecordForOrder } from '../controllers/FinancialController.js';

class OrderService {
    // --- Private Helpers ---

    _buildQuery(filters) {
        const query = {};
        const { status, paymentMethod, startDate, endDate, search } = filters;

        if (status && status !== 'all') query.status = status;
        if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        return query; // Search is handled separately due to sync/async requirements
    }

    // --- Public Methods ---

    async getOrders(query) {
        const {
            page = 1, limit = 20, status, search, sort = 'newest',
            paymentMethod, startDate, endDate,
        } = query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const dbQuery = this._buildQuery({ status, paymentMethod, startDate, endDate });

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const matchingUsers = await User.find({
                $or: [
                    { email: searchRegex },
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { username: searchRegex },
                ],
            }).select('_id');

            const userIds = matchingUsers.map((u) => u._id);

            dbQuery.$or = [
                { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
                { user: { $in: userIds } },
                { 'orderItems.name': searchRegex },
                { 'orderItems.sku': searchRegex },
            ].filter(Boolean);

            if (dbQuery.$or.length === 0) delete dbQuery.$or;
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            'total-high': { totalPrice: -1 },
            'total-low': { totalPrice: 1 },
        };
        const sortBy = sortOptions[sort] || sortOptions.newest;

        const [orders, total] = await Promise.all([
            Order.find(dbQuery)
                .populate('user', 'username email firstName lastName phone')
                .sort(sortBy)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Order.countDocuments(dbQuery),
        ]);

        const statusCounts = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const statusMap = statusCounts.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {});

        const stats = {
            total: await Order.countDocuments(), // Total active orders in DB
            pending: statusMap.pending || 0,
            paid: statusMap.paid || 0,
            shipped: statusMap.shipped || 0,
            delivered: statusMap.delivered || 0,
            cancelled: statusMap.cancelled || 0,
        };

        return {
            orders,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
            stats,
        };
    }

    async getOrderById(id) {
        const order = await Order.findById(id)
            .populate('user', 'username email firstName lastName phone createdAt')
            .lean();
        if (!order) throw new Error('Order not found');
        return order;
    }

    async updateOrderStatus(id, updateData) {
        const { status, trackingNumber, estimatedDelivery, deliveredAt, actualDeliveryTime } = updateData;
        const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) throw new Error('Invalid status');

        const order = await Order.findById(id);
        if (!order) throw new Error('Order not found');

        switch (status) {
            case 'paid':
                await order.markAsPaid({ status: 'manual_update' });
                break;
            case 'shipped':
                await order.markAsShipped({ trackingNumber, estimatedDelivery });
                break;
            case 'delivered':
                await order.markAsDelivered({ deliveredAt, actualDeliveryTime });
                await upsertFinancialRecordForOrder({ orderId: order._id, status: 'confirmed' });
                break;
            case 'cancelled':
                await order.cancelOrder();
                break;
            default:
                order.status = status;
                await order.save();
        }

        const updatedOrder = await Order.findById(order._id)
            .populate('user', 'username email firstName lastName')
            .lean();

        return updatedOrder;
    }

    async getOrderStats(period = '30d') {
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
            case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
            default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const [statusCounts, revenueStats, recentOrders] = await Promise.all([
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $in: ['paid', 'shipped', 'delivered'] } } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, orderCount: { $sum: 1 }, avgOrderValue: { $avg: '$totalPrice' } } },
            ]),
            Order.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
        ]);

        const statusMap = statusCounts.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {});
        const revenue = revenueStats[0] || { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 };

        return {
            period,
            orders: {
                total: Object.values(statusMap).reduce((a, b) => a + b, 0),
                pending: statusMap.pending || 0,
                paid: statusMap.paid || 0,
                shipped: statusMap.shipped || 0,
                delivered: statusMap.delivered || 0,
                cancelled: statusMap.cancelled || 0,
                last24h: recentOrders,
            },
            revenue: {
                total: revenue.totalRevenue,
                orderCount: revenue.orderCount,
                avgOrderValue: Math.round(revenue.avgOrderValue || 0),
            },
        };
    }

    async deleteOrder(id) {
        const order = await Order.findById(id);
        if (!order) throw new Error('Order not found');
        if (order.status !== 'cancelled') await order.cancelOrder();
        return true;
    }

    async getMyOrders(userId, { status = 'all', limit = 50 }) {
        const query = { user: userId };
        if (status !== 'all') query.status = status;

        return Order.find(query)
            .select('status totalPrice shippingPrice paymentMethod createdAt paidAt shippedAt deliveredAt estimatedDelivery trackingNumber orderItems')
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(limit) || 50, 200))
            .lean();
    }

    async getMyOrderById(orderId, userId) {
        const order = await Order.findOne({ _id: orderId, user: userId })
            .select('status totalPrice shippingPrice paymentMethod createdAt paidAt shippedAt deliveredAt estimatedDelivery trackingNumber orderItems shippingAddress')
            .lean();
        if (!order) throw new Error('Order not found');
        return order;
    }
}

export default new OrderService();
