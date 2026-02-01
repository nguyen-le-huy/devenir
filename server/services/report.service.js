import Order from '../models/OrderModel.js';

class ReportService {
    /**
     * Export Orders Report
     * @param {Object} params - Report parameters (fileType, columns, filters, sorting, reportType)
     * @returns {Object} - { buffer, filename, contentType }
     */
    async exportOrdersReport({
        fileType = 'csv',
        columns = ['orderId', 'customerName', 'customerEmail', 'products', 'totalPrice', 'paymentMethod', 'status', 'createdAt'],
        filters = {},
        sorting = { field: 'createdAt', order: 'desc' },
        reportType = 'all',
    }) {
        // Validate file type
        if (!['csv', 'excel'].includes(fileType)) {
            throw new Error('Invalid file type. Must be csv or excel');
        }

        // Build query
        const query = {};
        const { statusFilter, paymentMethodFilter, dateFilter } = filters;

        if (statusFilter && statusFilter !== 'all') query.status = statusFilter;
        if (paymentMethodFilter && paymentMethodFilter !== 'all') query.paymentMethod = paymentMethodFilter;

        if (dateFilter) {
            query.createdAt = {};
            if (dateFilter.from) query.createdAt.$gte = new Date(dateFilter.from);
            if (dateFilter.to) query.createdAt.$lte = new Date(dateFilter.to);
        }

        switch (reportType) {
            case 'pending': query.status = 'pending'; break;
            case 'paid': query.status = 'paid'; break;
            case 'shipped': query.status = 'shipped'; break;
            case 'delivered': query.status = 'delivered'; break;
            case 'cancelled': query.status = 'cancelled'; break;
            case 'completed': query.status = { $in: ['paid', 'shipped', 'delivered'] }; break;
        }

        const sortFieldMap = { createdAt: 'createdAt', totalPrice: 'totalPrice', status: 'status' };
        const sortField = sortFieldMap[sorting.field] || 'createdAt';
        const sortDirection = sorting.order === 'asc' ? 1 : -1;

        const orders = await Order.find(query)
            .populate('user', 'username email firstName lastName phone')
            .sort({ [sortField]: sortDirection })
            .limit(10000)
            .lean();

        if (!orders.length) {
            // Return null or specific object to indicate no data, let controller handle HTTP response
            return { noData: true };
        }

        // Helper formatting functions
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
            const statusMap = { pending: 'Chờ Xử Lý', paid: 'Đã Thanh Toán', shipped: 'Đang Giao', delivered: 'Hoàn Thành', cancelled: 'Đã Hủy' };
            return statusMap[status] || status;
        };

        const formatPaymentMethod = (method) => {
            const methodMap = { Bank: 'Chuyển Khoản', Crypto: 'Crypto', COD: 'COD' };
            return methodMap[method] || method;
        };

        const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value || 0) + ' ₫';

        const getCustomerName = (order) => {
            if (!order.user) return 'N/A';
            const fullName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
            return fullName || order.user.username || order.user.email || 'N/A';
        };

        const getProductsSummary = (order) => {
            if (!order.orderItems || order.orderItems.length === 0) return '';
            return order.orderItems.map(item => `${item.name} (${item.color}/${item.size}) x${item.quantity}`).join('\n');
        };

        const getTotalItems = (order) => order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

        const columnMapping = {
            orderId: { header: 'Mã Đơn', getValue: (order) => order._id.toString().slice(-8).toUpperCase() },
            fullOrderId: { header: 'Mã Đơn (Đầy Đủ)', getValue: (order) => order._id.toString() },
            customerName: { header: 'Khách Hàng', getValue: (order) => getCustomerName(order) },
            customerEmail: { header: 'Email', getValue: (order) => order.user?.email || 'N/A' },
            customerPhone: { header: 'Số Điện Thoại', getValue: (order) => order.shippingAddress?.phone || order.user?.phone || '' },
            products: { header: 'Sản Phẩm', getValue: (order) => getProductsSummary(order) },
            totalItems: { header: 'Số Lượng', getValue: (order) => getTotalItems(order) },
            shippingAddress: { header: 'Địa Chỉ', getValue: (order) => order.shippingAddress ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}`.trim() : '' },
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

        const rows = orders.map((order) =>
            selectedColumns.map((col) => {
                const value = columnMapping[col].getValue(order);
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            })
        );

        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const totalOrders = orders.length;

        const reportTypeInfo = {
            all: { title: 'BÁO CÁO ĐƠN HÀNG - TẤT CẢ', filePrefix: 'tat_ca' },
            pending: { title: 'BÁO CÁO ĐƠN HÀNG CHỜ XỬ LÝ', filePrefix: 'cho_xu_ly' },
            paid: { title: 'BÁO CÁO ĐƠN HÀNG ĐÃ THANH TOÁN', filePrefix: 'da_thanh_toan' },
            shipped: { title: 'BÁO CÁO ĐƠN HÀNG ĐANG GIAO', filePrefix: 'dang_giao' },
            delivered: { title: 'BÁO CÁO ĐƠN HÀNG HOÀN THÀNH', filePrefix: 'hoan_thanh' },
            cancelled: { title: 'BÁO CÁO ĐƠN HÀNG ĐÃ HỦY', filePrefix: 'da_huy' },
        };
        const reportInfo = reportTypeInfo[reportType] || reportTypeInfo.all;

        const now = new Date();
        const exportDateTime = formatDate(now);
        const filename = `baocao_donhang_${reportInfo.filePrefix}_${now.toISOString().slice(0, 10).replace(/-/g, '')}.csv`;

        let csvContent = `"${reportInfo.title}"\n"Ngày xuất: ${exportDateTime}"\n"Tổng số đơn: ${totalOrders} | Tổng doanh thu: ${formatCurrency(totalRevenue)}"\n\n`;
        csvContent += headers.join(',') + '\n';
        csvContent += rows.map((row) => row.join(',')).join('\n');

        if (fileType === 'excel') csvContent += `\n\n"TỔNG CỘNG","${totalOrders} đơn","","","","${formatCurrency(totalRevenue)}"`;

        return {
            content: '\uFEFF' + csvContent,
            filename,
            contentType: 'text/csv; charset=utf-8'
        };
    }
}

export default new ReportService();
