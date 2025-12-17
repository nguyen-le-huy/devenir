import asyncHandler from 'express-async-handler';
import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import { upsertFinancialRecordForOrder } from './FinancialController.js';
import { emitOrderUpdate } from '../utils/socketEmitter.js';

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
export const getOrders = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        search,
        sort = 'newest',
        paymentMethod,
        startDate,
        endDate,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Filter by status
    if (status && status !== 'all') {
        query.status = status;
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod !== 'all') {
        query.paymentMethod = paymentMethod;
    }

    // Filter by date range
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by order ID or customer info
    if (search) {
        const searchRegex = new RegExp(search, 'i');

        // Find users matching search
        const matchingUsers = await User.find({
            $or: [
                { email: searchRegex },
                { firstName: searchRegex },
                { lastName: searchRegex },
                { username: searchRegex },
            ],
        }).select('_id');

        const userIds = matchingUsers.map((u) => u._id);

        query.$or = [
            { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
            { user: { $in: userIds } },
            { 'orderItems.name': searchRegex },
            { 'orderItems.sku': searchRegex },
        ].filter(Boolean);

        // Remove $or if empty
        if (query.$or.length === 0) delete query.$or;
    }

    // Sort options
    const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'total-high': { totalPrice: -1 },
        'total-low': { totalPrice: 1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    // Execute query
    const [orders, total] = await Promise.all([
        Order.find(query)
            .populate('user', 'username email firstName lastName phone')
            .sort(sortBy)
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Order.countDocuments(query),
    ]);

    // Get status counts for filters
    const statusCounts = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    // Calculate stats
    const stats = {
        total: await Order.countDocuments(),
        pending: statusMap.pending || 0,
        paid: statusMap.paid || 0,
        shipped: statusMap.shipped || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
    };

    res.status(200).json({
        success: true,
        data: orders,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
        stats,
    });
});

/**
 * @desc    Get order by ID (Admin)
 * @route   GET /api/admin/orders/:id
 * @access  Private/Admin
 */
export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'username email firstName lastName phone createdAt')
        .lean();

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.status(200).json({
        success: true,
        data: order,
    });
});

/**
 * @desc    Update order status (Admin)
 * @route   PATCH /api/admin/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, trackingNumber, estimatedDelivery, deliveredAt, actualDeliveryTime } = req.body;
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
        res.status(400);
        throw new Error('Invalid status. Must be one of: ' + validStatuses.join(', '));
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Status transition logic
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

    emitOrderUpdate(req.app.get('io'), updatedOrder);

    res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: updatedOrder,
    });
});

/**
 * @desc    Get order stats overview (Admin)
 * @route   GET /api/admin/orders/stats
 * @access  Private/Admin
 */
export const getOrderStats = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'ytd':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Aggregate stats
    const [statusCounts, revenueStats, recentOrders] = await Promise.all([
        // Status counts
        Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Revenue in period
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $in: ['paid', 'shipped', 'delivered'] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$totalPrice' },
                },
            },
        ]),
        // Recent orders count
        Order.countDocuments({
            createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        }),
    ]);

    const statusMap = statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    const revenue = revenueStats[0] || { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 };

    res.status(200).json({
        success: true,
        data: {
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
        },
    });
});

/**
 * @desc    Delete order (Admin - soft delete by cancelling)
 * @route   DELETE /api/admin/orders/:id
 * @access  Private/Admin
 */
export const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Cancel order instead of hard delete (to maintain data integrity)
    if (order.status !== 'cancelled') {
        await order.cancelOrder();
    }

    res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
    });
});

/**
 * @desc    Export orders report (Admin)
 * @route   POST /api/admin/orders/export
 * @access  Private/Admin
 */
export const exportOrdersReport = asyncHandler(async (req, res) => {
    const {
        fileType = 'csv',
        columns = ['orderId', 'customerName', 'customerEmail', 'products', 'totalPrice', 'paymentMethod', 'status', 'createdAt'],
        filters = {},
        sorting = { field: 'createdAt', order: 'desc' },
        reportType = 'all',
    } = req.body;

    // Validate file type
    if (!['csv', 'excel'].includes(fileType)) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_FILTERS', message: 'Invalid file type. Must be csv or excel' },
        });
    }

    // Build query
    const query = {};
    const { statusFilter, paymentMethodFilter, dateFilter } = filters;

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
        query.status = statusFilter;
    }

    // Apply payment method filter
    if (paymentMethodFilter && paymentMethodFilter !== 'all') {
        query.paymentMethod = paymentMethodFilter;
    }

    // Apply date filter
    if (dateFilter) {
        query.createdAt = {};
        if (dateFilter.from) query.createdAt.$gte = new Date(dateFilter.from);
        if (dateFilter.to) query.createdAt.$lte = new Date(dateFilter.to);
    }

    // Apply report type specific filters
    if (reportType === 'pending') {
        query.status = 'pending';
    } else if (reportType === 'paid') {
        query.status = 'paid';
    } else if (reportType === 'shipped') {
        query.status = 'shipped';
    } else if (reportType === 'delivered') {
        query.status = 'delivered';
    } else if (reportType === 'cancelled') {
        query.status = 'cancelled';
    } else if (reportType === 'completed') {
        query.status = { $in: ['paid', 'shipped', 'delivered'] };
    }

    // Sort options
    const sortFieldMap = {
        createdAt: 'createdAt',
        totalPrice: 'totalPrice',
        status: 'status',
    };
    const sortField = sortFieldMap[sorting.field] || 'createdAt';
    const sortDirection = sorting.order === 'asc' ? 1 : -1;

    // Limit to 10,000 rows max
    const orders = await Order.find(query)
        .populate('user', 'username email firstName lastName phone')
        .sort({ [sortField]: sortDirection })
        .limit(10000)
        .lean();

    if (!orders.length) {
        return res.status(200).json({
            success: false,
            error: { code: 'NO_DATA', message: 'No orders match the specified filters' },
        });
    }

    // Helper functions
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${mins}`;
    };

    const formatStatus = (status) => {
        const statusMap = {
            pending: 'Chờ Xử Lý',
            paid: 'Đã Thanh Toán',
            shipped: 'Đang Giao',
            delivered: 'Hoàn Thành',
            cancelled: 'Đã Hủy',
        };
        return statusMap[status] || status;
    };

    const formatPaymentMethod = (method) => {
        const methodMap = {
            Bank: 'Chuyển Khoản',
            Crypto: 'Crypto',
            COD: 'COD',
        };
        return methodMap[method] || method;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value || 0) + ' ₫';
    };

    const getCustomerName = (order) => {
        if (!order.user) return 'N/A';
        const firstName = order.user.firstName || '';
        const lastName = order.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || order.user.username || order.user.email || 'N/A';
    };

    const getProductsSummary = (order) => {
        if (!order.orderItems || order.orderItems.length === 0) return '';
        // List all products, each on a new line for better readability in Excel
        return order.orderItems.map(item =>
            `${item.name} (${item.color}/${item.size}) x${item.quantity}`
        ).join('\n');
    };

    const getTotalItems = (order) => {
        return order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    };

    // Column mapping - simple 1 order = 1 row
    const columnMapping = {
        orderId: { header: 'Mã Đơn', getValue: (order) => order._id.toString().slice(-8).toUpperCase() },
        fullOrderId: { header: 'Mã Đơn (Đầy Đủ)', getValue: (order) => order._id.toString() },
        customerName: { header: 'Khách Hàng', getValue: (order) => getCustomerName(order) },
        customerEmail: { header: 'Email', getValue: (order) => order.user?.email || 'N/A' },
        customerPhone: { header: 'Số Điện Thoại', getValue: (order) => order.shippingAddress?.phone || order.user?.phone || '' },
        products: { header: 'Sản Phẩm', getValue: (order) => getProductsSummary(order) },
        totalItems: { header: 'Số Lượng', getValue: (order) => getTotalItems(order) },
        shippingAddress: {
            header: 'Địa Chỉ',
            getValue: (order) => {
                const addr = order.shippingAddress;
                if (!addr) return '';
                return `${addr.street || ''}, ${addr.city || ''}`.trim();
            }
        },
        totalPrice: { header: 'Tổng Tiền', getValue: (order) => formatCurrency(order.totalPrice) },
        shippingPrice: { header: 'Phí Vận Chuyển', getValue: (order) => formatCurrency(order.shippingPrice) },
        paymentMethod: { header: 'Thanh Toán', getValue: (order) => formatPaymentMethod(order.paymentMethod) },
        paymentGateway: { header: 'Cổng Thanh Toán', getValue: (order) => order.paymentGateway || '' },
        status: { header: 'Trạng Thái', getValue: (order) => formatStatus(order.status) },
        createdAt: { header: 'Ngày Đặt', getValue: (order) => formatDate(order.createdAt) },
        paidAt: { header: 'Ngày Thanh Toán', getValue: (order) => formatDate(order.paidAt) },
        deliveredAt: { header: 'Ngày Giao', getValue: (order) => formatDate(order.deliveredAt) },
        appliedGiftCode: { header: 'Mã Giảm Giá', getValue: (order) => order.appliedGiftCode || '' },
    };

    const selectedColumns = columns.filter((col) => columnMapping[col]);
    const headers = selectedColumns.map((col) => columnMapping[col].header);

    // Simple mapping: 1 order = 1 row
    const rows = orders.map((order) =>
        selectedColumns.map((col) => {
            const value = columnMapping[col].getValue(order);
            // Always wrap in quotes if contains comma, quote, or newline
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        })
    );

    // Calculate summary
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalOrders = orders.length;

    // Report type mapping for title and filename
    const reportTypeInfo = {
        all: {
            title: 'BÁO CÁO ĐƠN HÀNG - TẤT CẢ',
            filePrefix: 'tat_ca',
        },
        pending: {
            title: 'BÁO CÁO ĐƠN HÀNG - CHỜ XỬ LÝ',
            filePrefix: 'cho_xu_ly',
        },
        paid: {
            title: 'BÁO CÁO ĐƠN HÀNG - ĐÃ THANH TOÁN',
            filePrefix: 'da_thanh_toan',
        },
        shipped: {
            title: 'BÁO CÁO ĐƠN HÀNG - ĐANG GIAO',
            filePrefix: 'dang_giao',
        },
        delivered: {
            title: 'BÁO CÁO ĐƠN HÀNG - HOÀN THÀNH',
            filePrefix: 'hoan_thanh',
        },
        cancelled: {
            title: 'BÁO CÁO ĐƠN HÀNG - ĐÃ HỦY',
            filePrefix: 'da_huy',
        },
        completed: {
            title: 'BÁO CÁO ĐƠN HÀNG - ĐƠN THÀNH CÔNG',
            filePrefix: 'don_thanh_cong',
        },
        custom: {
            title: 'BÁO CÁO ĐƠN HÀNG - TÙY CHỈNH',
            filePrefix: 'tuy_chinh',
        },
    };

    const reportInfo = reportTypeInfo[reportType] || reportTypeInfo.all;

    // Generate formatted datetime
    const now = new Date();
    const exportDateTime = formatDate(now);
    const dateForFile = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeForFile = now.toTimeString().slice(0, 5).replace(':', '');

    // Generate filename
    const filename = `baocao_donhang_${reportInfo.filePrefix}_${dateForFile}_${timeForFile}.csv`;

    // Build CSV content
    let csvContent = '';

    // Add title rows
    csvContent += `"${reportInfo.title}"\n`;
    csvContent += `"Ngày xuất: ${exportDateTime}"\n`;
    csvContent += `"Tổng số đơn: ${totalOrders} | Tổng doanh thu: ${formatCurrency(totalRevenue)}"\n`;
    csvContent += '\n';

    // Add headers and rows
    csvContent += headers.join(',') + '\n';
    csvContent += rows.map((row) => row.join(',')).join('\n');

    // Add summary row for Excel-style reports
    if (fileType === 'excel') {
        csvContent += '\n\n';
        csvContent += `"TỔNG CỘNG","${totalOrders} đơn","","","","${formatCurrency(totalRevenue)}"`;
    }

    // Set response headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).send('\uFEFF' + csvContent); // Add BOM for Excel UTF-8 compatibility
});

/**
 * @desc    Get orders of current user
 * @route   GET /api/orders/my
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
    const { status = 'all', limit = 50 } = req.query;

    const query = { user: req.user._id };
    if (status !== 'all') {
        query.status = status;
    }

    const orders = await Order.find(query)
        .select(
            'status totalPrice shippingPrice paymentMethod createdAt paidAt shippedAt deliveredAt estimatedDelivery trackingNumber orderItems'
        )
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 50, 200))
        .lean();

    return res.status(200).json({ success: true, data: orders });
});

/**
 * @desc    Get a single order of current user
 * @route   GET /api/orders/my/:id
 * @access  Private
 */
export const getMyOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
        .select(
            'status totalPrice shippingPrice paymentMethod createdAt paidAt shippedAt deliveredAt estimatedDelivery trackingNumber orderItems shippingAddress'
        )
        .lean();

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: order });
});
