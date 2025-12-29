import { openai, MODELS } from '../../../config/openai.js';
import Product from '../../../models/ProductModel.js';
import ProductVariant from '../../../models/ProductVariantModel.js';

import { searchProducts } from '../retrieval/vector-search.service.js';

/**
 * Size recommendation service
 * @param {string} query - User query about size
 * @param {Object} extractedInfo - Extracted info from intent classifier
 * @param {Object} context - Conversation context
 */
export async function sizeRecommendation(query, extractedInfo = {}, context = {}) {
    try {
        // Get product from extracted info or context
        let productId = extractedInfo.product_id || context.recent_product_id;
        let productName = null;

        // If no ID, try to find product from conversation context
        if (!productId) {
            const recentMsgs = context.recent_messages || [];

            // Look for product name in recent bot messages (bold **ProductName**)
            for (let i = recentMsgs.length - 1; i >= 0; i--) {
                const msg = recentMsgs[i];
                if (msg.role === 'assistant' || msg.sender === 'bot') {
                    const content = msg.content || msg.text || '';
                    // Extract bold product names
                    const boldMatches = content.match(/\*\*([^*]+)\*\*/g);
                    if (boldMatches && boldMatches.length > 0) {
                        // Get the first significant bold text (likely product name)
                        for (const match of boldMatches) {
                            const text = match.replace(/\*\*/g, '').trim();
                            // Skip short texts like prices or sizes
                            if (text.length > 10 && !text.startsWith('$') && !text.match(/^\d/)) {
                                productName = text;
                                console.log(`🔍 Found product name from context: "${productName}"`);
                                break;
                            }
                        }
                        if (productName) break;
                    }

                    // Also check suggested_products from previous messages
                    if (!productName && msg.suggestedProducts && msg.suggestedProducts.length > 0) {
                        productId = msg.suggestedProducts[0]._id || msg.suggestedProducts[0].id;
                        console.log(`🔍 Found productId from suggestedProducts: ${productId}`);
                        break;
                    }
                }
            }

            // If we found a product name, search for it in database by name
            if (productName && !productId) {
                console.log(`🔍 Searching for product: "${productName}"`);

                // Try exact match first (case insensitive)
                let product = await Product.findOne({
                    name: new RegExp(`^${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                    isActive: true
                }).lean();

                if (product) {
                    productId = product._id;
                    console.log(`✅ Exact match found: "${product.name}"`);
                } else {
                    // Find all products that contain the search term
                    const nameRegex = new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                    const matchingProducts = await Product.find({
                        name: nameRegex,
                        isActive: true
                    }).lean();

                    if (matchingProducts.length > 0) {
                        console.log(`📦 Found ${matchingProducts.length} matching products: ${matchingProducts.map(p => p.name).join(', ')}`);

                        // Score each product by how closely it matches the search term
                        const scoredProducts = matchingProducts.map(p => {
                            const pNameLower = p.name.toLowerCase();
                            const searchLower = productName.toLowerCase();

                            let score = 0;

                            // Exact match gets highest score
                            if (pNameLower === searchLower) {
                                score = 1000;
                            }
                            // Product name that starts with search term
                            else if (pNameLower.startsWith(searchLower)) {
                                score = 500;
                            }
                            // Search term matches the end of product name (e.g., "Bomber Jacket" in "Cashmere Bomber Jacket")
                            else if (pNameLower.endsWith(searchLower)) {
                                score = 400;
                            }
                            // Shorter names are preferred (more specific match)
                            else {
                                score = 100 - p.name.length;
                            }

                            return { product: p, score };
                        });

                        // Sort by score descending
                        scoredProducts.sort((a, b) => b.score - a.score);

                        product = scoredProducts[0].product;
                        productId = product._id;
                        console.log(`✅ Best match: "${product.name}" (score: ${scoredProducts[0].score})`);
                    }
                }

                // If still not found, try matching key words
                if (!product) {
                    const keywords = productName.split(/\s+/).filter(w => w.length > 3);
                    if (keywords.length >= 2) {
                        const keywordRegex = new RegExp(keywords.join('.*'), 'i');
                        product = await Product.findOne({
                            name: keywordRegex,
                            isActive: true
                        }).lean();

                        if (product) {
                            productId = product._id;
                            console.log(`✅ Keyword match found: "${product.name}"`);
                        }
                    }
                }

                if (!productId) {
                    console.log(`⚠️ Could not find product by name: "${productName}"`);
                }
            }

            // Fallback: vector search if query is descriptive enough
            if (!productId && query.length > 15) {
                const searchResults = await searchProducts(query, { topK: 1 });
                if (searchResults && searchResults.length > 0 && searchResults[0].score > 0.75) {
                    productId = searchResults[0].metadata.product_id;
                    console.log(`🔍 Found product via vector search: ${searchResults[0].metadata.product_name} (${productId})`);
                }
            }
        }

        if (!productId) {
            return {
                answer: `Để tư vấn size chính xác, bạn vui lòng cho biết:
        
• Thông tin cần thiết:
- Sản phẩm bạn quan tâm
- Chiều cao (cm)
- Cân nặng (kg)

Hoặc bạn có thể hỏi về size của sản phẩm cụ thể nhé!`
            };
        }

        // Get product and variants
        const product = await Product.findById(productId).populate('category').lean();

        if (!product) {
            return {
                answer: "Không tìm thấy thông tin sản phẩm. Bạn có thể cho tôi biết tên sản phẩm không? 🔍"
            };
        }

        const variants = await ProductVariant.find({
            product_id: productId,
            isActive: true,
            quantity: { $gt: 0 }
        }).lean();

        const availableSizes = [...new Set(variants.map(v => v.size))];

        if (availableSizes.length === 0) {
            return {
                answer: `Rất tiếc, sản phẩm **${product.name}** hiện đang hết hàng. Tôi có thể giúp bạn tìm sản phẩm tương tự không? 🔍`
            };
        }

        // Check for Free Size / One Size
        const isFreeSize = availableSizes.length === 1 &&
            ['free size', 'freesize', 'one size', 'onesize'].includes(availableSizes[0].toLowerCase());

        if (isFreeSize) {
            return {
                answer: `Sản phẩm **${product.name}** là **Free Size**, phù hợp với hầu hết mọi dáng người bạn nhé! Bạn có thể yên tâm đặt hàng ạ.`,
                size_recommendation: { recommended_size: availableSizes[0] },
                available_variants: variants,
                product_info: {
                    _id: product._id,
                    name: product.name,
                    urlSlug: product.urlSlug
                },
                // Add suggested action for add-to-cart button
                suggested_action: variants.length > 0 ? {
                    type: 'add_to_cart',
                    prompt: 'Bạn có muốn thêm sản phẩm này vào giỏ hàng không?',
                    product: {
                        _id: product._id,
                        name: product.name,
                        urlSlug: product.urlSlug,
                        variantId: variants[0]._id,
                        mainImage: variants[0].mainImage || product.images?.[0] || '',
                        minPrice: variants[0].price,
                        maxPrice: variants[0].price
                    },
                    variant_id: variants[0]._id
                } : null
            };
        }

        // Build prompt for size recommendation with specific size chart
        // Build size recommendation prompt
        const customerInfo = context.customerContext || '';
        const toneNote = context.customerProfile?.customerType 
            ? `\n(Khách hàng là ${context.customerProfile.customerType} - Điều chỉnh giọng điệu phù hợp)` 
            : '';

        const prompt = `
Tư vấn size cho sản phẩm thời trang dựa trên bảng size chuẩn.${toneNote}
${customerInfo}
**Sản phẩm:** ${product.name}
**Danh mục:** ${product.category?.name || 'N/A'}
**Sizes có sẵn:** ${availableSizes.join(', ')}

**Bảng Size Chuẩn:**
- XS:   < 1m60, < 50kg
- S:    1m60 - 1m65, 50 - 60kg
- M:    1m65 - 1m70, 60 - 70kg
- L:    1m70 - 1m75, 70 - 80kg
- XL:   1m75 - 1m80, 80 - 90kg
- XXL:  1m80 - 1m85, 90 - 100kg
- XXXL: > 1m85, > 100kg

**Thông tin khách hàng:**
${extractedInfo.height ? `- Chiều cao: ${extractedInfo.height}cm` : ''}
${extractedInfo.weight ? `- Cân nặng: ${extractedInfo.weight}kg` : ''}
${extractedInfo.usual_size ? `- Size thường mặc: ${extractedInfo.usual_size}` : ''}
${query}

**Yêu cầu:**
1. Đề xuất size phù hợp nhất dựa trên bảng size (CHỈ từ sizes có sẵn: ${availableSizes.join(', ')})
2. Nếu số đo nằm giữa 2 size, ưu tiên size lớn hơn cho thoải mái
3. Giải thích ngắn gọn lý do
${context.hasCustomerContext ? '4. Nếu khách hàng có lịch sử mua size cụ thể, tham khảo thông tin đó' : ''}

Trả về JSON: 
{
  "recommended_size": "...",
  "reason": "...",
  "alternative_size": "...",
  "fit_note": "..."
}
`;

        const response = await openai.chat.completions.create({
            model: MODELS.CHAT,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
        });

        const result = JSON.parse(response.choices[0].message.content);

        // Get variants of recommended size
        const recommendedVariants = variants.filter(v => v.size === result.recommended_size);

        // Build answer
        let answer = `Tư vấn size cho ${product.name}\n\n`;
        answer += `• Size đề xuất: ${result.recommended_size}\n\n`;
        answer += `${result.reason}\n\n`;

        if (result.fit_note) {
            answer += `• Lưu ý: ${result.fit_note}\n\n`;
        }

        if (result.alternative_size) {
            answer += `• Size dự phòng: ${result.alternative_size}\n\n`;
        }

        if (recommendedVariants.length > 0) {
            answer += `Sản phẩm size ${result.recommended_size} có sẵn:\n`;
            recommendedVariants.forEach(v => {
                answer += `- Màu ${v.color}: $${v.price.toLocaleString('en-US')} (Còn ${v.quantity} sản phẩm)\n`;
            });
        }

        answer += `\nBạn có muốn thêm vào giỏ hàng không?`;

        return {
            answer,
            size_recommendation: result,
            available_variants: recommendedVariants,
            product_info: {
                _id: product._id,
                name: product.name,
                urlSlug: product.urlSlug
            },
            // Add suggested action for add-to-cart button
            suggested_action: recommendedVariants.length > 0 ? {
                type: 'add_to_cart',
                prompt: 'Bạn có muốn thêm sản phẩm này vào giỏ hàng không?',
                product: {
                    _id: product._id,
                    name: product.name,
                    urlSlug: product.urlSlug,
                    variantId: recommendedVariants[0]._id,
                    mainImage: recommendedVariants[0].mainImage || product.images?.[0] || '',
                    minPrice: recommendedVariants[0].price,
                    maxPrice: recommendedVariants[0].price
                },
                variant_id: recommendedVariants[0]._id
            } : null
        };

    } catch (error) {
        console.error('Size Recommendation Error:', error);
        return {
            answer: "Xin lỗi, đã có lỗi khi tư vấn size. Bạn có thể cho tôi biết chiều cao và cân nặng để tôi tư vấn chính xác hơn không? 📏",
            error: error.message
        };
    }
}

/**
 * Get size guide for category
 * @param {string} categoryName - Category name
 */
export async function getSizeGuide(categoryName) {
    const sizeGuides = {
        'Áo thun': {
            S: { chest: '88-92', height: '155-165', weight: '50-58' },
            M: { chest: '92-98', height: '165-172', weight: '58-65' },
            L: { chest: '98-104', height: '172-178', weight: '65-73' },
            XL: { chest: '104-110', height: '178-185', weight: '73-82' }
        },
        'Quần': {
            S: { waist: '70-74', height: '155-165', weight: '50-58' },
            M: { waist: '74-80', height: '165-172', weight: '58-65' },
            L: { waist: '80-86', height: '172-178', weight: '65-73' },
            XL: { waist: '86-92', height: '178-185', weight: '73-82' }
        }
    };

    return sizeGuides[categoryName] || null;
}
