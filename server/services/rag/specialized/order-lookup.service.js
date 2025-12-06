import { llmProvider } from '../core/LLMProvider.js';
import Order from '../../../models/OrderModel.js';
import mongoose from 'mongoose';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id) {
    return id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

/**
 * Order lookup service - Enhanced for logged-in users
 * @param {string} query - User query about order
 * @param {Object} extractedInfo - Extracted info from intent classifier
 * @param {string} userId - User ID (from authenticated user)
 */
export async function orderLookup(query, extractedInfo = {}, userId) {
    // Validate userId - only use if it's a valid ObjectId
    const validUserId = isValidObjectId(userId) ? userId : null;
    try {
        // Step 1: Classify query type and extract order info
        const classifyPrompt = `
Phân tích yêu cầu tra cứu đơn hàng sau:

Câu hỏi: ${query}

Trả về JSON:
{
    "query_type": "list_all" | "specific" | "latest",
    "order_number": "..." hoặc null,
    "phone": "..." hoặc null,
    "email": "..." hoặc null
}

Quy tắc:
- "list_all": Người dùng muốn xem tất cả/danh sách đơn hàng (VD: "đơn hàng của tôi", "xem lịch sử đơn hàng", "các đơn tôi đã đặt")
- "specific": Có mã đơn hàng cụ thể, số điện thoại, hoặc email
- "latest": Muốn xem đơn hàng gần nhất (VD: "đơn gần nhất", "đơn mới nhất", "đơn cuối")
`;

        const classifyResult = await llmProvider.jsonCompletion(
            [{ role: 'user', content: classifyPrompt }],
            { temperature: 0.1 }
        );

        const { query_type, order_number, phone, email } = classifyResult;

        console.log(`📦 Order Query Type: ${query_type}, UserId: ${validUserId ? 'Yes' : 'No'}`);

        // Step 2: Handle based on query type

        // Case A: User wants to see all their orders (logged-in required)
        if (query_type === 'list_all' && validUserId) {
            return await handleListAllOrders(validUserId);
        }

        // Case B: User wants latest order (logged-in required)
        if (query_type === 'latest' && validUserId) {
            return await handleLatestOrder(validUserId);
        }

        // Case C: Specific order lookup
        if (order_number || phone || email) {
            return await handleSpecificOrder({ order_number, phone, email, userId: validUserId });
        }

        // Case D: User is logged in but no specific query type detected
        if (validUserId) {
            return await handleListAllOrders(validUserId);
        }

        // Case E: No user, no info - ask for details
        return {
            answer: `Để tra cứu đơn hàng, bạn vui lòng cung cấp:

- Mã đơn hàng (VD: #DH12345)
- Hoặc số điện thoại đặt hàng
- Hoặc email đặt hàng

Nếu bạn đăng nhập, mình có thể hiển thị tất cả đơn hàng của bạn!`
        };

    } catch (error) {
        console.error('Order Lookup Error:', error);
        return {
            answer: `Xin lỗi, đã có lỗi khi tra cứu đơn hàng. Vui lòng liên hệ hotline 0364075812 để được hỗ trợ.`,
            error: error.message
        };
    }
}

/**
 * Handle listing all orders for a logged-in user
 */
async function handleListAllOrders(userId) {
    const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    if (!orders || orders.length === 0) {
        return {
            answer: `Bạn chưa có đơn hàng nào.

Hãy khám phá các sản phẩm của DEVENIR và đặt hàng đầu tiên nhé!`,
            orders: []
        };
    }

    // Format order list
    let answer = `Đây là ${orders.length} đơn hàng gần nhất của bạn:\n\n`;

    orders.forEach((order, index) => {
        const statusText = getStatusText(order.status);
        const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN');
        const totalPrice = order.totalPrice || 0;
        const itemCount = order.orderItems?.length || 0;

        answer += `**${index + 1}. Đơn hàng #${order._id.toString().slice(-8).toUpperCase()}**\n`;
        answer += `- Trạng thái: ${statusText}\n`;
        answer += `- Ngày đặt: ${dateStr}\n`;
        answer += `- Tổng tiền: $${totalPrice.toLocaleString('en-US')}\n`;
        answer += `- Số sản phẩm: ${itemCount}\n\n`;
    });

    answer += `Bạn muốn xem chi tiết đơn hàng nào? Hãy cho mình biết mã đơn nhé!`;

    return {
        answer,
        orders: orders.map(o => ({
            id: o._id,
            status: o.status,
            totalPrice: o.totalPrice,
            createdAt: o.createdAt,
            itemCount: o.orderItems?.length || 0
        }))
    };
}

/**
 * Handle latest order lookup for logged-in user
 */
async function handleLatestOrder(userId) {
    const order = await Order.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate('orderItems.product')
        .lean();

    if (!order) {
        return {
            answer: `Bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm của DEVENIR nhé!`
        };
    }

    return formatOrderDetails(order);
}

/**
 * Handle specific order lookup
 */
async function handleSpecificOrder({ order_number, phone, email, userId }) {
    let orders = [];
    const cleanOrderNumber = order_number ? order_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : null;

    if (cleanOrderNumber) {
        // First, try to find by paymentIntent.gatewayOrderCode if it's numeric
        if (cleanOrderNumber.match(/^[0-9]+$/)) {
            const orderByCode = await Order.findOne({
                'paymentIntent.gatewayOrderCode': parseInt(cleanOrderNumber)
            }).populate('orderItems.product').lean();

            if (orderByCode) {
                return formatOrderDetails(orderByCode);
            }
        }

        // Otherwise, fetch orders and filter by partial _id match
        // Get orders for this user (or all if no userId) and check if _id ends with the given code
        const baseQuery = userId ? { user: userId } : {};
        orders = await Order.find(baseQuery)
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('orderItems.product')
            .lean();

        // Filter orders where the last 8 chars of _id match the order number
        const matchedOrder = orders.find(order => {
            const orderId = order._id.toString().slice(-8).toUpperCase();
            return orderId.includes(cleanOrderNumber) || cleanOrderNumber.includes(orderId);
        });

        if (matchedOrder) {
            return formatOrderDetails(matchedOrder);
        }
    } else if (userId) {
        // No order number, fall back to latest order for user
        const order = await Order.findOne({ user: userId })
            .sort({ createdAt: -1 })
            .populate('orderItems.product')
            .lean();

        if (order) return formatOrderDetails(order);
    } else if (phone) {
        const order = await Order.findOne({ 'shippingAddress.phone': phone })
            .sort({ createdAt: -1 })
            .populate('orderItems.product')
            .lean();

        if (order) return formatOrderDetails(order);
    } else if (email) {
        const order = await Order.findOne({ 'shippingAddress.email': email })
            .sort({ createdAt: -1 })
            .populate('orderItems.product')
            .lean();

        if (order) return formatOrderDetails(order);
    }

    // If nothing found
    return {
        answer: `Không tìm thấy đơn hàng với thông tin đã cung cấp.

Vui lòng kiểm tra lại:
- Mã đơn hàng
- Số điện thoại
- Email đặt hàng

Hoặc liên hệ hotline để được hỗ trợ: **0364075812**`
    };
}

/**
 * Format single order details
 */
function formatOrderDetails(order) {
    const statusText = getStatusText(order.status);
    const orderId = order._id.toString().slice(-8).toUpperCase();

    let answer = `Thông tin đơn hàng #${orderId}\n\n`;
    answer += `**Trạng thái:** ${statusText}\n`;

    if (order.trackingNumber) {
        answer += `**Mã vận đơn:** ${order.trackingNumber}\n`;
    }

    answer += `**Ngày đặt:** ${new Date(order.createdAt).toLocaleDateString('vi-VN')}\n`;
    answer += `**Tổng tiền:** $${(order.totalPrice || 0).toLocaleString('en-US')}\n\n`;

    // Shipping info
    if (order.shippingAddress) {
        const addr = order.shippingAddress;
        const fullName = addr.fullName || `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
        answer += `**Địa chỉ giao hàng:**\n`;
        if (fullName) answer += `${fullName}\n`;
        if (addr.street) answer += `${addr.street}\n`;
        if (addr.city || addr.district) answer += `${addr.district || ''} ${addr.city || ''}\n`;
        if (addr.phone) answer += `${addr.phone}\n\n`;
    }

    // Items summary
    if (order.orderItems && order.orderItems.length > 0) {
        answer += `**Sản phẩm:**\n`;
        order.orderItems.forEach((item, i) => {
            const productName = item.product?.name || item.name || 'Sản phẩm';
            const size = item.size ? ` - Size ${item.size}` : '';
            const color = item.color ? ` - ${item.color}` : '';
            answer += `${i + 1}. ${productName}${color}${size} x${item.quantity}\n`;
        });
    }

    // Add status-specific info
    answer += '\n';
    if (order.status === 'shipped') {
        answer += `Đơn hàng đang trên đường giao đến bạn!`;
        if (order.estimatedDelivery) {
            answer += ` Dự kiến: ${new Date(order.estimatedDelivery).toLocaleDateString('vi-VN')}`;
        }
    } else if (order.status === 'delivered') {
        answer += `Cảm ơn bạn đã mua hàng tại DEVENIR!`;
    } else if (order.status === 'paid') {
        answer += `Đơn hàng đang được xử lý, sẽ giao trong 1-2 ngày.`;
    } else if (order.status === 'pending') {
        answer += `Đơn hàng đang chờ thanh toán.`;
    } else if (order.status === 'cancelled') {
        answer += `Đơn hàng đã bị hủy.`;
    }

    return {
        answer,
        order_info: {
            id: order._id,
            status: order.status,
            totalPrice: order.totalPrice,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt
        }
    };
}

/**
 * Get Vietnamese status text
 */
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ thanh toán',
        'paid': 'Đã thanh toán',
        'confirmed': 'Đã xác nhận',
        'processing': 'Đang xử lý',
        'shipped': 'Đang giao hàng',
        'delivered': 'Đã giao thành công',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}
