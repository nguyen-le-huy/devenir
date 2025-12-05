import { openai, MODELS } from '../../../config/openai.js';
import { productAdvice } from './product-advisor.service.js';

/**
 * Style matcher service - suggest outfit combinations
 * @param {string} query - User query about styling
 * @param {Object} context - Conversation context
 */
export async function styleMatcher(query, context = {}) {
    try {
        // Get product suggestions first
        const productResults = await productAdvice(query + ' phối đồ outfit', context);

        if (!productResults.suggested_products || productResults.suggested_products.length === 0) {
            return {
                answer: `Để gợi ý phối đồ, bạn có thể cho tôi biết:
        
• Thông tin cần thiết:
- Bạn đang có sẵn món đồ nào?
- Dịp mặc (đi làm, đi chơi, dự tiệc...)?
- Phong cách yêu thích (casual, smart casual, formal...)?

Tôi sẽ gợi ý những outfit phù hợp cho bạn!`
            };
        }

        // Build style suggestion prompt
        const prompt = `
Bạn là stylist chuyên nghiệp. Hãy gợi ý outfit phối đồ.

**Yêu cầu khách hàng:** ${query}

**Sản phẩm có sẵn:**
${productResults.suggested_products.map((p, i) =>
            `${i + 1}. ${p.name} - $${p.minPrice?.toLocaleString('en-US')}`
        ).join('\n')}

Hãy đề xuất 2-3 cách phối đồ sử dụng các sản phẩm trên.
Giải thích style và dịp phù hợp cho mỗi outfit.

Format trả lời:
1. Mô tả ngắn gọn về style
2. Liệt kê các sản phẩm trong outfit
3. Dịp/occasion phù hợp
4. Tips phối đồ thêm
`;

        const response = await openai.chat.completions.create({
            model: MODELS.CHAT,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 800
        });

        const styleAnswer = response.choices[0].message.content;

        return {
            answer: styleAnswer,
            outfit_suggestions: productResults.suggested_products,
            sources: productResults.sources
        };

    } catch (error) {
        console.error('Style Matcher Error:', error);
        return {
            answer: "Xin lỗi, đã có lỗi khi gợi ý phối đồ. Bạn có thể mô tả phong cách mong muốn không?",
            error: error.message
        };
    }
}

/**
 * Get style recommendations based on occasion
 * @param {string} occasion - Occasion type
 */
export async function getStyleByOccasion(occasion) {
    const occasions = {
        'work': {
            style: 'Smart Casual / Business Casual',
            tips: ['Chọn màu trung tính', 'Tránh quá casual', 'Ưu tiên form vừa vặn'],
            categories: ['Áo sơ mi', 'Quần tây', 'Blazer']
        },
        'casual': {
            style: 'Casual / Street Style',
            tips: ['Thoải mái là chính', 'Mix & match tự do', 'Thể hiện cá tính'],
            categories: ['Áo thun', 'Quần jean', 'Áo hoodie']
        },
        'party': {
            style: 'Semi-Formal / Cocktail',
            tips: ['Chọn chất liệu sang trọng', 'Màu đậm / metallic', 'Phụ kiện điểm nhấn'],
            categories: ['Váy', 'Áo blazer', 'Đầm']
        },
        'date': {
            style: 'Smart Casual',
            tips: ['Gọn gàng, lịch sự', 'Tôn dáng', 'Màu sắc hài hòa'],
            categories: ['Áo sơ mi', 'Quần chinos', 'Váy']
        }
    };

    return occasions[occasion.toLowerCase()] || null;
}
