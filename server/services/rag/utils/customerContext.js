import User from '../../../models/UserModel.js';
import Order from '../../../models/OrderModel.js';
import { generateCustomerIntelligence } from '../../customerIntelligence.js';

/**
 * Build comprehensive customer context for RAG personalization
 * @param {String} userId - User ID
 * @returns {Object} - { contextString, intelligence, hasContext }
 */
export async function buildCustomerContext(userId) {
    try {
        // Guest users or anonymous - no context
        if (!userId || userId.startsWith('guest_') || userId === 'anonymous') {
            return {
                contextString: '',
                intelligence: null,
                hasContext: false
            };
        }

        // Fetch user profile + intelligence in parallel
        const [user, intelligence] = await Promise.all([
            User.findById(userId).lean(),
            generateCustomerIntelligence(userId).catch(() => null)
        ]);

        if (!user) {
            return { contextString: '', intelligence: null, hasContext: false };
        }

        // Build context sections
        const sections = [];

        // 1. Customer Classification
        if (intelligence?.customerType) {
            const typeDescriptions = {
                'VIP Premium': 'Khách VIP cao cấp - Thường xuyên mua hàng, giá trị cao, trung thành lâu dài',
                'Loyal Customer': 'Khách hàng trung thành - Mua sắm đều đặn, đáng tin cậy',
                'High-Intent Browser': 'Khách quan tâm cao - Đang nghiên cứu kỹ, có nhu cầu rõ ràng',
                'Price-Conscious': 'Khách nhạy cảm giá - Quan tâm đến giá trị, ưu đãi',
                'Window Shopper': 'Khách dạo chợ - Tò mò, cần thêm động lực mua hàng',
                'New Visitor': 'Khách mới - Cần xây dựng niềm tin và giới thiệu cơ bản'
            };

            sections.push(`## PHÂN LOẠI KHÁCH HÀNG
Loại: ${intelligence.customerType}
Mô tả: ${typeDescriptions[intelligence.customerType] || 'Khách hàng thông thường'}
Engagement Score: ${intelligence.engagementScore}/100
Risk Level: ${intelligence.riskLevel === 'high' ? 'CAO - Có nguy cơ rời bỏ' : intelligence.riskLevel === 'medium' ? 'TRUNG BÌNH' : 'THẤP - Ổn định'}`);
        }

        // 2. Customer Preferences & Interests (từ Tags)
        if (intelligence?.suggestedTags?.length > 0) {
            const interestTags = intelligence.suggestedTags.filter(t => 
                t.tag.startsWith('interested:') || t.tag.startsWith('brand:') || t.tag.startsWith('color:')
            );

            if (interestTags.length > 0) {
                const preferences = interestTags.map(t => {
                    const [type, value] = t.tag.split(':');
                    const typeMap = {
                        'interested': 'Quan tâm',
                        'brand': 'Thương hiệu yêu thích',
                        'color': 'Màu sắc ưa thích'
                    };
                    return `  - ${typeMap[type]}: ${value} (${(t.confidence * 100).toFixed(0)}% confidence)`;
                }).join('\n');

                sections.push(`## SỞ THÍCH & ƯU TIÊN\n${preferences}`);
            }
        }

        // 3. Shopping Behavior Insights
        if (intelligence?.behavior) {
            const behavior = intelligence.behavior;
            const insights = [];

            if (behavior.shopping?.total_added_to_cart > 0) {
                insights.push(`  - Đã thêm ${behavior.shopping.total_added_to_cart} sản phẩm vào giỏ hàng`);
                if (behavior.shopping.cart_abandonment_rate > 0.5) {
                    insights.push(`  - ⚠️ Tỷ lệ bỏ giỏ hàng CAO (${(behavior.shopping.cart_abandonment_rate * 100).toFixed(0)}%) - Cần động viên mua hàng`);
                }
            }

            if (behavior.shopping?.average_order_value) {
                insights.push(`  - Giá trị đơn hàng trung bình: $${behavior.shopping.average_order_value.toFixed(0)}`);
            }

            if (behavior.browsing?.most_viewed_category) {
                insights.push(`  - Danh mục xem nhiều nhất: ${behavior.browsing.most_viewed_category}`);
            }

            if (behavior.engagement?.search_pattern?.length > 0) {
                insights.push(`  - Từ khóa tìm kiếm gần đây: ${behavior.engagement.search_pattern.slice(0, 3).join(', ')}`);
            }

            if (insights.length > 0) {
                sections.push(`## HÀNH VI MUA SẮM\n${insights.join('\n')}`);
            }
        }

        // 4. Purchase History Summary
        if (user.totalSpent > 0 || user.orderHistory?.length > 0) {
            sections.push(`## LỊCH SỬ MUA HÀNG
  - Tổng chi tiêu: $${user.totalSpent || 0}
  - Số đơn hàng: ${user.orderHistory?.length || 0}
  - Khách hàng từ: ${new Date(user.createdAt).toLocaleDateString('vi-VN')}`);
        }

        // 5. Important Notes (từ Admin)
        if (user.customerProfile?.notesList?.length > 0) {
            const recentNotes = user.customerProfile.notesList
                .filter(n => n.important)
                .slice(0, 2)
                .map(n => `  - ${n.note}`)
                .join('\n');
            
            if (recentNotes) {
                sections.push(`## GHI CHÚ QUAN TRỌNG\n${recentNotes}`);
            }
        }

        // 6. Next Best Action (AI Suggestion)
        if (intelligence?.nextBestAction) {
            sections.push(`## ĐỀ XUẤT HÀNH ĐỘNG
${intelligence.nextBestAction}`);
        }

        // Combine all sections
        const contextString = sections.length > 0 
            ? `\n## THÔNG TIN KHÁCH HÀNG (Chỉ dùng nội bộ, KHÔNG tiết lộ trực tiếp)\n${sections.join('\n\n')}\n`
            : '';

        return {
            contextString,
            intelligence,
            hasContext: sections.length > 0,
            userProfile: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                customerType: intelligence?.customerType,
                engagementScore: intelligence?.engagementScore
            }
        };

    } catch (error) {
        console.error('❌ Error building customer context:', error);
        return {
            contextString: '',
            intelligence: null,
            hasContext: false,
            error: error.message
        };
    }
}

/**
 * Build tone instruction based on customer type
 */
export function getToneInstruction(customerType) {
    const tones = {
        'VIP Premium': 'Giọng điệu SANG TRỌNG, CHUYÊN NGHIỆP. Sử dụng ngôn ngữ tinh tế, đề xuất sản phẩm cao cấp. Thể hiện sự trân trọng và ưu tiên.',
        'Loyal Customer': 'Giọng điệu THÂN THIỆN, NHIỆT TÌNH. Cảm ơn sự trung thành, đề xuất sản phẩm phù hợp với lịch sử mua hàng.',
        'High-Intent Browser': 'Giọng điệu TƯ VẤN CHUYÊN SÂU. Cung cấp thông tin chi tiết, so sánh sản phẩm, giúp ra quyết định.',
        'Price-Conscious': 'Giọng điệu THỰC TẾ. Nhấn mạnh GIÁ TRỊ, chất lượng/giá, ưu đãi. Tránh đề xuất sản phẩm quá cao cấp.',
        'Window Shopper': 'Giọng điệu KHUYẾN KHÍCH. Tạo động lực mua hàng, nhấn mạnh lợi ích, thời hạn ưu đãi.',
        'New Visitor': 'Giọng điệu GIỚI THIỆU, THÂN THIỆN. Xây dựng niềm tin, giải thích rõ ràng về thương hiệu và sản phẩm.'
    };

    return tones[customerType] || 'Giọng điệu THÂN THIỆN, TỰ NHIÊN.';
}
