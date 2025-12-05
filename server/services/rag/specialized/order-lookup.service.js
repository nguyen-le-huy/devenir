import { openai, MODELS } from '../../../config/openai.js';
import Order from '../../../models/OrderModel.js';

/**
 * Order lookup service
 * @param {string} query - User query about order
 * @param {Object} extractedInfo - Extracted info from intent classifier
 * @param {string} userId - User ID
 */
export async function orderLookup(query, extractedInfo = {}, userId) {
    try {
        // Extract order info from query using LLM
        const extractPrompt = `
Trích xuất thông tin tra cứu đơn hàng từ câu hỏi sau:

Câu hỏi: ${query}

Trả về JSON: {"order_number": "...", "phone": "...", "email": "..."}
Nếu không có thông tin, để null.
`;

        const extractResponse = await openai.chat.completions.create({
            model: MODELS.CHAT_FAST,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: extractPrompt }]
        });

        const extracted = JSON.parse(extractResponse.choices[0].message.content);

        // Build query to find order
        let orderQuery = {};

        if (extracted.order_number) {
            orderQuery.orderCode = extracted.order_number;
        } else if (userId) {
            orderQuery.user = userId;
        } else if (extracted.phone) {
            orderQuery['shippingAddress.phone'] = extracted.phone;
        } else if (extracted.email) {
            orderQuery['shippingAddress.email'] = extracted.email;
        }

        // If no search criteria, ask for more info
        if (Object.keys(orderQuery).length === 0) {
            return {
                answer: `Để tra cứu đơn hàng, bạn vui lòng cung cấp:
        
• Thông tin cần thiết:
- Mã đơn hàng (VD: #DH12345)
- Hoặc số điện thoại đặt hàng
- Hoặc email đặt hàng

Tôi sẽ kiểm tra tình trạng đơn hàng cho bạn ngay!`
            };
        }

        // Query MongoDB for order
        const order = await Order.findOne(orderQuery)
            .sort({ createdAt: -1 })
            .populate('items.product')
            .lean();

        if (!order) {
            return {
                answer: `Không tìm thấy đơn hàng với thông tin đã cung cấp.

Vui lòng kiểm tra lại:
- Mã đơn hàng
- Số điện thoại
- Email đặt hàng

Hoặc liên hệ hotline để được hỗ trợ: **1900 xxxx**`
            };
        }

        // Format order status
        const statusMap = {
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'processing': 'Đang xử lý',
            'shipped': 'Đang giao hàng',
            'delivered': 'Đã giao thành công',
            'cancelled': 'Đã hủy'
        };

        const orderStatus = statusMap[order.status] || order.status;

        // Build answer
        let answer = `Thông tin đơn hàng #${order.orderCode}\n\n`;
        answer += `**Trạng thái:** ${orderStatus}\n`;

        if (order.trackingNumber) {
            answer += `**Mã vận đơn:** ${order.trackingNumber}\n`;
        }

        answer += `**Ngày đặt:** ${new Date(order.createdAt).toLocaleDateString('vi-VN')}\n`;
        answer += `**Tổng tiền:** $${(order.totalPrice || order.subtotal)?.toLocaleString('en-US')}\n\n`;

        // Shipping info
        if (order.shippingAddress) {
            answer += `**Địa chỉ giao hàng:**\n`;
            answer += `${order.shippingAddress.fullName || ''}\n`;
            answer += `${order.shippingAddress.address || ''}\n`;
            answer += `${order.shippingAddress.phone || ''}\n\n`;
        }

        // Items summary
        if (order.items && order.items.length > 0) {
            answer += `**Sản phẩm:**\n`;
            order.items.forEach((item, i) => {
                const productName = item.product?.name || item.name || 'Sản phẩm';
                answer += `${i + 1}. ${productName} x${item.quantity}\n`;
            });
        }

        // Add status-specific info
        if (order.status === 'shipped') {
            answer += `\nĐơn hàng đang trên đường giao đến bạn!`;
            if (order.estimatedDelivery) {
                answer += ` Dự kiến: ${new Date(order.estimatedDelivery).toLocaleDateString('vi-VN')}`;
            }
        } else if (order.status === 'delivered') {
            answer += `\nCảm ơn bạn đã mua hàng tại DEVENIR!`;
        } else if (order.status === 'processing') {
            answer += `\nĐơn hàng đang được đóng gói, sẽ giao trong 1-2 ngày.`;
        }

        return {
            answer,
            order_info: {
                orderCode: order.orderCode,
                status: order.status,
                totalPrice: order.totalPrice || order.subtotal,
                trackingNumber: order.trackingNumber,
                createdAt: order.createdAt
            }
        };

    } catch (error) {
        console.error('Order Lookup Error:', error);
        return {
            answer: `Xin lỗi, đã có lỗi khi tra cứu đơn hàng. Vui lòng liên hệ hotline 0364075812 để được hỗ trợ.`,
            error: error.message
        };
    }
}
