import Product from '../../../models/ProductModel.js';
import ProductVariant from '../../../models/ProductVariantModel.js';
import Color from '../../../models/ColorModel.js';
import { searchProducts } from '../retrieval/vector-search.service.js';
import { rerankDocuments } from '../retrieval/reranking.service.js';
import { generateResponse } from '../generation/response-generator.js';

// Vietnamese to English color mapping
const VI_TO_EN_COLORS = {
    'trắng': 'white',
    'đen': 'black',
    'đỏ': 'red',
    'xanh': 'blue',
    'xanh lá': 'green',
    'vàng': 'yellow',
    'hồng': 'pink',
    'nâu': 'brown',
    'xám': 'gray',
    'cam': 'orange',
    'tím': 'purple',
    'be': 'beige',
    'kem': 'cream',
    'đỏ rượu': 'wine red',
    'xanh navy': 'navy',
    'xanh đen': 'dark blue'
};

// Common English compound colors
const COMPOUND_COLORS = [
    'wine red', 'dark red', 'light red',
    'navy blue', 'dark blue', 'light blue', 'sky blue',
    'dark green', 'light green', 'olive green',
    'dark brown', 'light brown',
    'dark gray', 'light gray', 'charcoal',
    'off white', 'cream white',
    'hot pink', 'light pink', 'dusty pink',
    'burgundy', 'maroon', 'coral', 'salmon',
    'khaki', 'taupe', 'ivory', 'nude'
];

// Cache for colors from database
let colorCache = null;
let colorCacheTime = 0;
const COLOR_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Load colors from database with caching
 */
async function getColorsFromDB() {
    const now = Date.now();
    if (colorCache && (now - colorCacheTime) < COLOR_CACHE_TTL) {
        return colorCache;
    }

    try {
        const colors = await Color.find({ isActive: true }).lean();
        colorCache = colors.map(c => c.name.toLowerCase());
        colorCacheTime = now;
        return colorCache;
    } catch (error) {
        console.error('Error loading colors:', error);
        return [];
    }
}

/**
 * Find matching color from query
 * Enhanced to detect compound colors like "wine red", "navy blue"
 */
async function findColorInQuery(query) {
    const queryLower = query.toLowerCase();

    // 1. First check colors from database (highest priority - exact match)
    const dbColors = await getColorsFromDB();
    for (const color of dbColors) {
        if (queryLower.includes(color)) {
            console.log(`🎨 Found DB color: "${color}"`);
            return { vi: color, en: color };
        }
    }

    // 2. Check compound English colors (e.g., "wine red", "navy blue")
    for (const color of COMPOUND_COLORS) {
        if (queryLower.includes(color)) {
            console.log(`🎨 Found compound color: "${color}"`);
            return { vi: color, en: color };
        }
    }

    // 3. Check Vietnamese colors mapping
    for (const [vi, en] of Object.entries(VI_TO_EN_COLORS)) {
        if (queryLower.includes(vi)) {
            console.log(`🎨 Found VI color: "${vi}" → "${en}"`);
            return { vi, en };
        }
    }

    return null;
}

/**
 * Product advice using RAG pipeline
 * @param {string} query - User query
 * @param {Object} context - Conversation context
 */
export async function productAdvice(query, context = {}) {
    try {
        // Enrich short queries with context from conversation history
        let enrichedQuery = query;
        const recentMsgs = context.recent_messages || [];

        if (query.length < 30 && recentMsgs.length > 0) {
            // Find the last assistant message with product info
            const assistantMessages = recentMsgs.filter(m =>
                (m.role === 'assistant' || m.sender === 'bot') &&
                (m.content || m.text)?.length > 50
            );

            const lastProductContext = assistantMessages.slice(-1)[0];

            if (lastProductContext) {
                const content = lastProductContext.content || lastProductContext.text || '';
                // Extract product name from **ProductName** format
                const productMatch = content.match(/\*\*([^*]+)\*\*/);
                if (productMatch) {
                    enrichedQuery = `${query} ${productMatch[1]}`;
                    console.log(`📝 Enriched query: "${query}" → "${enrichedQuery}"`);
                }
            }
        }

        // 1. Vector search (with enriched query)
        const searchResults = await searchProducts(enrichedQuery, { topK: 50 });

        // Check if user is asking about a specific color
        const requestedColor = await findColorInQuery(query);

        // 2. If color requested, also search MongoDB for products with that color
        let colorMatchedProductIds = [];
        if (requestedColor) {
            const colorRegex = new RegExp(requestedColor.en, 'i');
            const colorVariants = await ProductVariant.find({
                color: colorRegex,
                isActive: true,
                quantity: { $gt: 0 }
            }).select('product_id').lean();

            colorMatchedProductIds = [...new Set(colorVariants.map(v => v.product_id?.toString()))];
            console.log(`🎨 Found ${colorMatchedProductIds.length} products with color "${requestedColor.en}"`);
        }

        if ((!searchResults || searchResults.length === 0) && colorMatchedProductIds.length === 0) {
            return {
                answer: "Mình chưa tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn được không?",
                sources: [],
                suggested_products: []
            };
        }

        // 3. Rerank for better relevance (get more results for better matching)
        const documents = searchResults.map(r => r.metadata?.proposition_text || '');
        const reranked = await rerankDocuments(query, documents, 10);

        // 4. Get unique product IDs - combine vector search + color search
        let productIds = [
            ...new Set(
                reranked.map(r => searchResults[r.index]?.metadata?.product_id).filter(Boolean)
            )
        ];

        // Add color-matched products if not already included
        for (const colorProdId of colorMatchedProductIds) {
            if (!productIds.includes(colorProdId)) {
                productIds.unshift(colorProdId); // Add to front (higher priority)
            }
        }

        if (productIds.length === 0) {
            return {
                answer: "Mình chưa tìm thấy thông tin sản phẩm. Bạn thử từ khóa khác xem nhé?",
                sources: [],
                suggested_products: []
            };
        }

        // 4. Get full product details from MongoDB (only populate category)
        const products = await Product.find({ _id: { $in: productIds } })
            .populate('category')
            .lean();

        // 5. Get variants for each product
        const productsWithVariants = await Promise.all(
            products.map(async (product) => {
                const variants = await ProductVariant.find({
                    product_id: product._id,
                    isActive: true,
                    quantity: { $gt: 0 }
                }).lean();
                return { ...product, variants };
            })
        );

        // 6. Build context for LLM
        let contextText = "## Sản phẩm liên quan:\n\n";
        let contextIdx = 0;

        // First, add color-matched products to context (highest priority)
        if (requestedColor && colorMatchedProductIds.length > 0) {
            contextText += `### Sản phẩm màu ${requestedColor.vi}:\n\n`;

            for (const colorProdId of colorMatchedProductIds) {
                const product = productsWithVariants.find(p => p._id.toString() === colorProdId);
                if (product) {
                    contextIdx++;
                    contextText += `### ${contextIdx}. ${product.name}\n`;
                    contextText += `- **Danh mục:** ${product.category?.name || 'N/A'}\n`;

                    if (product.variants && product.variants.length > 0) {
                        // Find variants with matching color
                        const matchingVariants = product.variants.filter(v =>
                            v.color?.toLowerCase().includes(requestedColor.en) ||
                            v.color?.toLowerCase().includes(requestedColor.vi)
                        );

                        if (matchingVariants.length > 0) {
                            // Get price range for this specific color
                            const colorPrices = matchingVariants.map(v => v.price);
                            const colorMinPrice = Math.min(...colorPrices);
                            const colorMaxPrice = Math.max(...colorPrices);
                            const colorStock = matchingVariants.reduce((sum, v) => sum + v.quantity, 0);
                            const colorSizes = [...new Set(matchingVariants.map(v => v.size))];

                            contextText += `- **Màu sắc:** ${matchingVariants[0].color}\n`;

                            // Show exact price if all variants of this color have same price
                            if (colorMinPrice === colorMaxPrice) {
                                contextText += `- **Giá màu ${matchingVariants[0].color}:** $${colorMinPrice.toLocaleString('en-US')}\n`;
                            } else {
                                contextText += `- **Giá màu ${matchingVariants[0].color}:** $${colorMinPrice.toLocaleString('en-US')} - $${colorMaxPrice.toLocaleString('en-US')}\n`;
                            }

                            contextText += `- **Sizes có sẵn:** ${colorSizes.join(', ')}\n`;
                            contextText += `- **Còn hàng:** ${colorStock} sản phẩm\n`;
                        } else {
                            // Fallback to all variants if no color match
                            const colors = [...new Set(product.variants.map(v => v.color))];
                            const prices = product.variants.map(v => v.price);
                            contextText += `- **Màu sắc:** ${colors.join(', ')}\n`;
                            contextText += `- **Giá:** $${Math.min(...prices).toLocaleString('en-US')} - $${Math.max(...prices).toLocaleString('en-US')}\n`;
                            contextText += `- **Còn hàng:** ${product.variants.reduce((sum, v) => sum + v.quantity, 0)} sản phẩm\n`;
                        }
                    }
                    contextText += `\n`;
                }
            }
            contextText += `\n### Sản phẩm khác:\n\n`;
        }

        // Then add products from vector search
        reranked.forEach((r, idx) => {
            const match = searchResults[r.index];
            const product = productsWithVariants.find(
                p => p._id.toString() === match?.metadata?.product_id
            );

            // Skip if already added from color search
            if (product && !colorMatchedProductIds.includes(product._id.toString())) {
                contextIdx++;
                contextText += `### ${contextIdx}. ${product.name}\n`;
                contextText += `- **Danh mục:** ${product.category?.name || 'N/A'}\n`;
                contextText += `- **Thương hiệu:** ${typeof product.brand === 'object' ? product.brand?.name : product.brand || 'N/A'}\n`;

                if (product.description) {
                    contextText += `- **Mô tả:** ${product.description.substring(0, 500)}${product.description.length > 500 ? '...' : ''}\n`;
                }

                if (product.variants && product.variants.length > 0) {
                    const sizes = [...new Set(product.variants.map(v => v.size))];
                    const colors = [...new Set(product.variants.map(v => v.color))];
                    const prices = product.variants.map(v => v.price);

                    contextText += `- **Sizes có sẵn:** ${sizes.join(', ')}\n`;
                    contextText += `- **Màu sắc:** ${colors.join(', ')}\n`;
                    contextText += `- **Giá:** $${Math.min(...prices).toLocaleString('en-US')} - $${Math.max(...prices).toLocaleString('en-US')}\n`;
                    contextText += `- **Còn hàng:** ${product.variants.reduce((sum, v) => sum + v.quantity, 0)} sản phẩm\n`;
                }

                if (product.averageRating) {
                    contextText += `- **Đánh giá:** ${product.averageRating}/5\n`;
                }

                contextText += `\n`;
            }
        });
        // 7. Generate natural language response
        console.log('\\n=== CONTEXT BEING SENT TO LLM ===');
        console.log(contextText.substring(0, 2000));
        console.log('=== END CONTEXT ===\\n');

        const answer = await generateResponse(query, contextText, context.recent_messages);

        // 8. Prepare sources and suggested products
        const sources = reranked.map(r => {
            const match = searchResults[r.index];
            const product = productsWithVariants.find(
                p => p._id.toString() === match?.metadata?.product_id
            );

            return {
                product_id: match?.metadata?.product_id,
                product_name: match?.metadata?.product_name,
                relevance_score: r.relevance_score,
                url_slug: product?.urlSlug,
            };
        });

        // Get unique products in reranked order
        const seenProductIds = new Set();
        const orderedProducts = [];

        // First, add color-matched products (highest priority)
        if (requestedColor && colorMatchedProductIds.length > 0) {
            for (const colorProdId of colorMatchedProductIds) {
                if (!seenProductIds.has(colorProdId)) {
                    const product = productsWithVariants.find(p => p._id.toString() === colorProdId);
                    if (product) {
                        seenProductIds.add(colorProdId);
                        orderedProducts.push(product);
                        console.log(`✅ Added color-matched product: ${product.name}`);
                    }
                }
            }
        }

        // Then add products from vector search
        for (const r of reranked) {
            const match = searchResults[r.index];
            const productId = match?.metadata?.product_id;

            if (productId && !seenProductIds.has(productId)) {
                const product = productsWithVariants.find(p => p._id.toString() === productId);
                if (product) {
                    seenProductIds.add(productId);
                    orderedProducts.push(product);
                }
            }

            if (orderedProducts.length >= 5) break;
        }

        // Re-order: prioritize products mentioned in the answer
        const answerLower = answer.toLowerCase();
        orderedProducts.sort((a, b) => {
            const aInAnswer = answerLower.includes(a.name.toLowerCase());
            const bInAnswer = answerLower.includes(b.name.toLowerCase());
            if (aInAnswer && !bInAnswer) return -1;
            if (!aInAnswer && bInAnswer) return 1;
            return 0;
        });

        // Use requestedColor from earlier (already found in step 2)

        const suggested_products = await Promise.all(orderedProducts.slice(0, 3).map(async (p) => {
            // Get ALL variants for this product (including out-of-stock) for price/image fallback
            const allVariantsForProduct = await ProductVariant.find({
                product_id: p._id,
                isActive: true
            }).lean();

            // Use in-stock variants if available, otherwise use all variants
            const variantsToUse = p.variants?.length > 0 ? p.variants : allVariantsForProduct;

            // Find variant matching requested color, or fallback to first variant
            let matchingVariant = variantsToUse?.[0];
            let matchingVariants = []; // All variants matching the color

            if (requestedColor && variantsToUse?.length > 0) {
                matchingVariants = variantsToUse.filter(v => {
                    const variantColor = (v.color || '').toLowerCase();
                    // Match by Vietnamese name, English name, or partial match
                    return variantColor.includes(requestedColor.vi) ||
                        variantColor.includes(requestedColor.en) ||
                        requestedColor.en.split(' ').some(part => variantColor.includes(part));
                });
                if (matchingVariants.length > 0) {
                    matchingVariant = matchingVariants[0];
                }
            }

            // Calculate price based on matching color variants or all variants
            let minPrice, maxPrice;
            if (matchingVariants.length > 0) {
                // Use price range of matching color variants only
                const colorPrices = matchingVariants.map(v => v.price).filter(p => p > 0);
                minPrice = colorPrices.length > 0 ? Math.min(...colorPrices) : 0;
                maxPrice = colorPrices.length > 0 ? Math.max(...colorPrices) : 0;
            }

            // Fallback: use all variants if no color match or still $0
            if (!minPrice || minPrice === 0) {
                const allPrices = variantsToUse?.map(v => v.price).filter(p => p > 0) || [];
                minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
            }

            // Calculate stock status
            const inStockVariants = p.variants?.filter(v => v.quantity > 0) || [];
            const totalStock = inStockVariants.reduce((sum, v) => sum + v.quantity, 0);
            const isInStock = totalStock > 0;

            // Ensure we always have an image
            const mainImage = matchingVariant?.mainImage ||
                variantsToUse?.[0]?.mainImage ||
                allVariantsForProduct?.[0]?.mainImage ||
                p.images?.[0] || '';

            return {
                _id: p._id,
                name: p.name,
                urlSlug: p.urlSlug,
                variantId: matchingVariant?._id || variantsToUse?.[0]?._id || null,
                averageRating: p.averageRating,
                minPrice,
                maxPrice,
                mainImage,
                inStock: isInStock,
                totalStock
            };
        }));

        return {
            answer,
            sources,
            suggested_products
        };

    } catch (error) {
        console.error('Product Advice Error:', error);
        return {
            answer: "Có lỗi xảy ra khi tìm kiếm sản phẩm. Bạn thử lại sau nhé!",
            sources: [],
            suggested_products: [],
            error: error.message
        };
    }
}
