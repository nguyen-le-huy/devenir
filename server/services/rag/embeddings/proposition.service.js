import { openai, MODELS } from '../../../config/openai.js';

/**
 * Create propositions from product data
 * Mỗi proposition là một fact độc lập về sản phẩm
 */
export async function createProductPropositions(product, variants = []) {
    const categoryName = product.category?.name || 'N/A';
    const brandName = product.brand?.name || 'N/A';

    const availableSizes = [...new Set(variants.map(v => v.size))];
    const availableColors = [...new Set(variants.map(v => v.color))];

    const priceRange = variants.length > 0
        ? {
            min: Math.min(...variants.map(v => v.price)),
            max: Math.max(...variants.map(v => v.price))
        }
        : null;

    const prompt = `
Phân tích sản phẩm thời trang sau thành các mệnh đề nguyên tử, độc lập.

Thông tin:
- Tên: ${product.name}
- Mô tả: ${product.description || 'N/A'}
- Danh mục: ${categoryName}
- Thương hiệu: ${brandName}
- Tags: ${product.tags?.join(', ') || 'N/A'}
- Sizes: ${availableSizes.join(', ') || 'N/A'}
- Màu sắc: ${availableColors.join(', ') || 'N/A'}
- Giá: ${priceRange ? `${priceRange.min.toLocaleString()}-${priceRange.max.toLocaleString()} VNĐ` : 'N/A'}

Tạo 8-12 mệnh đề hữu ích cho tư vấn khách hàng. Mỗi mệnh đề phải:
1. Chứa tên sản phẩm
2. Là một fact độc lập, dễ hiểu
3. Hữu ích cho việc tìm kiếm

Trả về JSON: {"propositions": ["...", "..."]}
`;

    try {
        const response = await openai.chat.completions.create({
            model: MODELS.CHAT,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result.propositions || [];
    } catch (error) {
        console.error('Proposition Creation Error:', error);
        // Return basic propositions as fallback
        return [
            `${product.name} thuộc danh mục ${categoryName}`,
            `${product.name} của thương hiệu ${brandName}`,
            availableSizes.length > 0 ? `${product.name} có sizes ${availableSizes.join(', ')}` : null,
            availableColors.length > 0 ? `${product.name} có màu ${availableColors.join(', ')}` : null,
            priceRange ? `${product.name} có giá từ ${priceRange.min.toLocaleString()} đến ${priceRange.max.toLocaleString()} VNĐ` : null
        ].filter(Boolean);
    }
}

/**
 * Create simple text chunks from description
 * Alternative to LLM-based propositions
 */
export function createSimpleChunks(product, variants = []) {
    const chunks = [];
    const productName = product.name;

    // Basic info chunk
    chunks.push(`${productName} - ${product.category?.name || 'Sản phẩm'} của ${product.brand?.name || 'thương hiệu'}`);

    // Description chunks (split by sentences)
    if (product.description) {
        const sentences = product.description.split(/[.!?]+/).filter(s => s.trim());
        for (const sentence of sentences.slice(0, 5)) {
            chunks.push(`${productName}: ${sentence.trim()}`);
        }
    }

    // Size info
    const sizes = [...new Set(variants.map(v => v.size))];
    if (sizes.length > 0) {
        chunks.push(`${productName} có các size: ${sizes.join(', ')}`);
    }

    // Color info
    const colors = [...new Set(variants.map(v => v.color))];
    if (colors.length > 0) {
        chunks.push(`${productName} có các màu: ${colors.join(', ')}`);
    }

    // Price info
    if (variants.length > 0) {
        const prices = variants.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        chunks.push(`${productName} có giá từ ${minPrice.toLocaleString()} đến ${maxPrice.toLocaleString()} VNĐ`);
    }

    // Tags
    if (product.tags && product.tags.length > 0) {
        chunks.push(`${productName} - ${product.tags.join(', ')}`);
    }

    return chunks;
}
