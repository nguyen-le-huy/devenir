/**
 * Policy & FAQ Service
 * Handles questions about payment methods, shipping, returns, etc.
 */

// Store policy information
const PAYMENT_INFO = {
    methods: [
        {
            name: 'PayOS',
            description: 'Thanh toán qua ngân hàng nội địa Việt Nam',
            type: 'bank_transfer',
            fee: 'Miễn phí'
        },
        {
            name: 'NowPayments',
            description: 'Thanh toán bằng cryptocurrency (Bitcoin, USDT, ETH...)',
            type: 'crypto',
            fee: 'Miễn phí'
        }
    ]
};

const SHIPPING_INFO = {
    options: [
        {
            name: 'Standard delivery',
            price: 'FREE',
            time: '2-3 ngày làm việc',
            description: 'Giao hàng tiêu chuẩn miễn phí'
        },
        {
            name: 'Next day delivery',
            price: '$5',
            time: '1 ngày làm việc',
            description: 'Giao hàng nhanh trong ngày hôm sau'
        },
        {
            name: 'Nominated day delivery',
            price: '$10',
            time: 'Chọn ngày',
            description: 'Chọn ngày giao hàng theo ý bạn'
        }
    ]
};

const RETURN_POLICY = {
    period: '30 ngày',
    conditions: [
        'Sản phẩm chưa qua sử dụng, còn nguyên tag',
        'Có hóa đơn mua hàng',
        'Đổi size miễn phí trong 7 ngày đầu'
    ],
    contact: '0364075812'
};

/**
 * Handle policy-related queries
 * @param {string} query - User query
 * @param {Object} extractedInfo - Info from intent classifier
 */
export async function policyFAQ(query, extractedInfo = {}) {
    const lowerQuery = query.toLowerCase();

    // Detect query type
    const isPaymentQuery = ['payment', 'thanh toán', 'pay', 'mua', 'tiền', 'crypto', 'bitcoin', 'payos', 'nowpayments'].some(k => lowerQuery.includes(k));
    const isShippingQuery = ['shipping', 'giao hàng', 'ship', 'delivery', 'vận chuyển', 'phí ship'].some(k => lowerQuery.includes(k));
    const isReturnQuery = ['return', 'đổi trả', 'hoàn', 'refund', 'bảo hành', 'đổi size'].some(k => lowerQuery.includes(k));

    let answer = '';

    if (isPaymentQuery) {
        answer = `**Phương thức thanh toán tại DEVENIR:**\n\n`;
        PAYMENT_INFO.methods.forEach((method, idx) => {
            answer += `${idx + 1}. **${method.name}**\n`;
            answer += `   - ${method.description}\n`;
            answer += `   - Phí: ${method.fee}\n\n`;
        });
        answer += `Cả hai phương thức đều an toàn và được xử lý tự động. Bạn có thể chọn phương thức phù hợp khi checkout!`;
    } else if (isShippingQuery) {
        answer = `**Các tùy chọn giao hàng:**\n\n`;
        SHIPPING_INFO.options.forEach((option, idx) => {
            answer += `${idx + 1}. **${option.name}** - ${option.price}\n`;
            answer += `   - Thời gian: ${option.time}\n`;
            answer += `   - ${option.description}\n\n`;
        });
        answer += `Bạn có thể chọn hình thức phù hợp khi đặt hàng nhé!`;
    } else if (isReturnQuery) {
        answer = `**Chính sách đổi trả:**\n\n`;
        answer += `• Thời hạn: ${RETURN_POLICY.period}\n\n`;
        answer += `**Điều kiện:**\n`;
        RETURN_POLICY.conditions.forEach(cond => {
            answer += `- ${cond}\n`;
        });
        answer += `\nLiên hệ hotline: **${RETURN_POLICY.contact}** để được hỗ trợ!`;
    } else {
        // General policy overview
        answer = `Mình có thể hỗ trợ bạn về:\n\n`;
        answer += `**Thanh toán:** PayOS (ngân hàng VN) hoặc NowPayments (crypto)\n\n`;
        answer += `**Giao hàng:**\n`;
        answer += `- Standard: Miễn phí (2-3 ngày)\n`;
        answer += `- Next day: $5 (ngày hôm sau)\n`;
        answer += `- Nominated: $10 (chọn ngày)\n\n`;
        answer += `**Đổi trả:** 30 ngày, đổi size miễn phí trong 7 ngày\n\n`;
        answer += `Bạn muốn biết thêm chi tiết về vấn đề nào?`;
    }

    return {
        answer,
        policy_type: isPaymentQuery ? 'payment' : isShippingQuery ? 'shipping' : isReturnQuery ? 'return' : 'general'
    };
}
