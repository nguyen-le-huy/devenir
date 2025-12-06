import Product from '../../../models/ProductModel.js';
import ProductVariant from '../../../models/ProductVariantModel.js';
import { searchProducts } from '../retrieval/vector-search.service.js';

/**
 * Handle add to cart intent
 * When user wants to add a product to cart from chat context
 * @param {string} query - User message
 * @param {Object} extractedInfo - Info from intent classifier
 * @param {Object} context - Conversation context
 */
export async function handleAddToCart(query, extractedInfo = {}, context = {}) {
    try {
        // Try to find product from context (previous conversation)
        let product = null;
        let variant = null;

        // Check if there's a product mentioned in recent messages
        const recentMsgs = context.recent_messages || [];

        // Look for product name in recent bot messages
        for (let i = recentMsgs.length - 1; i >= 0; i--) {
            const msg = recentMsgs[i];
            if (msg.role === 'assistant' || msg.sender === 'bot') {
                const content = msg.content || msg.text || '';
                // Extract product name from **ProductName** format
                const productMatch = content.match(/\*\*([^*]+)\*\*/);
                if (productMatch) {
                    const productName = productMatch[1];
                    // Find the product in database
                    product = await Product.findOne({
                        name: { $regex: productName, $options: 'i' }
                    }).lean();

                    if (product) {
                        // Get first available variant
                        variant = await ProductVariant.findOne({
                            product_id: product._id,
                            isActive: true,
                            quantity: { $gt: 0 }
                        }).lean();
                        break;
                    }
                }
            }
        }

        // If not found in context, try vector search with the query
        if (!product) {
            const searchResults = await searchProducts(query, { topK: 1 });
            if (searchResults && searchResults.length > 0) {
                const productId = searchResults[0].metadata?.product_id;
                if (productId) {
                    product = await Product.findById(productId).lean();
                    if (product) {
                        variant = await ProductVariant.findOne({
                            product_id: product._id,
                            isActive: true,
                            quantity: { $gt: 0 }
                        }).lean();
                    }
                }
            }
        }

        // If still no product found
        if (!product || !variant) {
            return {
                answer: "Mình cần biết sản phẩm cụ thể bạn muốn thêm vào giỏ hàng. Bạn có thể chọn từ danh sách sản phẩm bên trên hoặc cho mình biết tên sản phẩm nhé!"
            };
        }

        // Return with suggested_action for add to cart confirmation
        return {
            answer: `Bạn muốn thêm **${product.name}** vào giỏ hàng?`,
            suggested_products: [{
                _id: product._id,
                name: product.name,
                urlSlug: product.urlSlug,
                variantId: variant._id,
                mainImage: variant.mainImage || product.images?.[0] || '',
                minPrice: variant.price,
                maxPrice: variant.price
            }],
            suggested_action: {
                type: 'add_to_cart',
                prompt: 'Xác nhận thêm vào giỏ hàng?',
                product: {
                    _id: product._id,
                    name: product.name,
                    urlSlug: product.urlSlug,
                    variantId: variant._id,
                    mainImage: variant.mainImage || product.images?.[0] || '',
                    minPrice: variant.price,
                    maxPrice: variant.price
                },
                variant_id: variant._id
            }
        };

    } catch (error) {
        console.error('Add to Cart Error:', error);
        return {
            answer: "Có lỗi xảy ra. Bạn có thể click vào sản phẩm để xem chi tiết và thêm vào giỏ hàng trực tiếp nhé!",
            error: error.message
        };
    }
}
