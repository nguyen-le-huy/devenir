import Product from '../../../models/ProductModel.js';
import ProductVariant from '../../../models/ProductVariantModel.js';
import Color from '../../../models/ColorModel.js';
import { searchProducts, searchByCategoryMongoDB } from '../retrieval/vector-search.service.js';
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

    // Helper function to check if color exists as a whole word
    const matchesAsWord = (text, color) => {
        // Create regex with word boundaries
        const regex = new RegExp(`\\b${color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text);
    };

    // 1. First check colors from database (highest priority - exact match)
    const dbColors = await getColorsFromDB();
    for (const color of dbColors) {
        if (matchesAsWord(queryLower, color)) {
            console.log(`🎨 Found DB color: "${color}"`);
            return { vi: color, en: color };
        }
    }

    // 2. Check compound English colors (e.g., "wine red", "navy blue")
    for (const color of COMPOUND_COLORS) {
        if (matchesAsWord(queryLower, color)) {
            console.log(`🎨 Found compound color: "${color}"`);
            return { vi: color, en: color };
        }
    }

    // 3. Check Vietnamese colors mapping (with word boundary)
    for (const [vi, en] of Object.entries(VI_TO_EN_COLORS)) {
        if (matchesAsWord(queryLower, vi)) {
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
        // Enrich intent with context from conversation history
        let enrichedQuery = query;
        const recentMsgs = context.recent_messages || [];

        // Check for referring expressions: "này", "đó", "trên", "vừa rồi", "this", "that", "it"
        // OR if query is relatively short (up to 100 chars instead of 30)
        const referringKeywords = ['này', 'đó', 'kia', 'vừa rồi', 'trên', 'this', 'that', 'it', 'him', 'her', 'them', 'previous'];
        const hasReferring = referringKeywords.some(k => query.toLowerCase().includes(k));

        if ((query.length < 100 || hasReferring) && recentMsgs.length > 0) {
            // Find the last assistant message with product info
            const assistantMessages = recentMsgs.filter(m =>
                (m.role === 'assistant' || m.sender === 'bot') &&
                (m.content || m.text)?.length > 20 // Lower threshold to catch short answers too
            );

            const lastProductContext = assistantMessages.slice(-1)[0]; // Get the very last one

            if (lastProductContext) {
                const content = lastProductContext.content || lastProductContext.text || '';

                // Extract ALL product names from **ProductName** format
                // The previous logic only took the first one, but maybe we discussed multiple.
                // For "this product", taking the LAST mentioned product is usually safer, or all of them.
                const productMatches = [...content.matchAll(/\*\*([^*]+)\*\*/g)].map(m => m[1]);

                if (productMatches.length > 0) {
                    // Use unique names
                    const uniqueProducts = [...new Set(productMatches)];

                    // If multiple products found, use them all joined, but prioritize the last one?
                    // Currently text search works best with "query + context".
                    // Let's prepend the context to ensure it's high priority, or append?
                    // Appending is safer for "query + context" logic in RAG.

                    // Optimization: If query explicitly asks for "product details", "price", etc.,
                    // and we have a product name, we should make the product name the PRIMARY search term.

                    enrichedQuery = `${query} ${uniqueProducts.join(' ')}`;
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
            // Try fallback: direct category/product search in MongoDB
            const categoryFallback = await searchByCategoryMongoDB(query);
            if (categoryFallback.products.length > 0) {
                console.log(`📂 Fallback category search found ${categoryFallback.products.length} products`);

                // Build suggested products from fallback
                const suggested_products = await Promise.all(
                    categoryFallback.products.slice(0, 3).map(async (p) => {
                        const variants = await ProductVariant.find({
                            product_id: p._id,
                            isActive: true
                        }).lean();

                        const prices = variants.map(v => v.price).filter(pr => pr > 0);
                        const mainVariant = variants[0];

                        return {
                            _id: p._id,
                            name: p.name,
                            urlSlug: p.urlSlug,
                            variantId: mainVariant?._id || null,
                            minPrice: prices.length > 0 ? Math.min(...prices) : 0,
                            maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
                            mainImage: mainVariant?.mainImage || '',
                            inStock: variants.some(v => v.quantity > 0),
                            totalStock: variants.reduce((sum, v) => sum + v.quantity, 0)
                        };
                    })
                );

                return {
                    answer: categoryFallback.answer,
                    sources: [],
                    suggested_products
                };
            }

            return {
                answer: "Mình chưa tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn được không?",
                sources: [],
                suggested_products: []
            };
        }

        // 3. Rerank for better relevance (get more results for better matching)
        const documents = searchResults.map(r => r.metadata?.proposition_text || '');
        const reranked = await rerankDocuments(enrichedQuery, documents, 10);

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

        // 5. Get variants for all products in one go (Optimization)
        const allVariants = await ProductVariant.find({
            product_id: { $in: productIds },
            isActive: true,
            quantity: { $gt: 0 }
        }).lean();

        // Group variants by product_id
        const variantsByProductId = allVariants.reduce((acc, variant) => {
            const pId = variant.product_id.toString();
            if (!acc[pId]) acc[pId] = [];
            acc[pId].push(variant);
            return acc;
        }, {});

        // Attach variants to products
        const productsWithVariants = products.map(product => {
            return {
                ...product,
                variants: variantsByProductId[product._id.toString()] || []
            };
        });

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

        const answer = await generateResponse(
            query,
            contextText,
            context.recent_messages,
            context.hasCustomerContext ? context : null
        );

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

        // First, add color-matched products (ONLY if user actually requested a color)
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
                if (orderedProducts.length >= 5) break; // Limit color-matched to 5
            }
        }

        // Then add products from vector search (higher limit to ensure we get products mentioned in answer)
        for (const r of reranked) {
            const match = searchResults[r.index];
            const productId = match?.metadata?.product_id;

            if (productId && !seenProductIds.has(productId)) {
                const product = productsWithVariants.find(p => p._id.toString() === productId);
                if (product) {
                    seenProductIds.add(productId);
                    orderedProducts.push(product);
                    console.log(`📦 Added vector search product: ${product.name}`);
                }
            }

            if (orderedProducts.length >= 10) break; // Higher limit for better matching
        }

        // Re-order: prioritize products mentioned in the answer (extracted from **ProductName**)
        const answerLower = answer.toLowerCase();

        // Extract product names mentioned in bold (**ProductName**)
        const boldProductMatches = answer.match(/\*\*([^*]+)\*\*/g) || [];
        const boldProductNames = boldProductMatches
            .map(m => m.replace(/\*\*/g, '').toLowerCase().trim())
            .filter(name => name.length > 3); // Filter out short matches like "$" 

        console.log(`🔍 Extracted bold product names from answer: ${boldProductNames.join(', ')}`);

        // Key product type words for matching
        const productTypeKeywords = ['jacket', 'coat', 'scarf', 'sweater', 'polo', 'shirt', 'dress', 'pants', 'trousers', 'skirt', 'bag', 'backpack', 'hat', 'cap', 'belt', 'cardigan', 'bomber', 'blazer', 'hoodie', 'knit'];

        // Create a scored list of products
        const scoredProducts = orderedProducts.map(p => {
            const productNameLower = p.name.toLowerCase();
            const productNameWords = productNameLower.split(/\s+/);
            let score = 0;
            let matchedBoldName = '';

            // High score if product name appears in bold in the answer
            for (const boldName of boldProductNames) {
                const boldWords = boldName.split(/\s+/);

                // Exact match gets highest score
                if (productNameLower === boldName) {
                    score = 200;
                    matchedBoldName = boldName;
                    console.log(`🎯 EXACT match: "${p.name}" === "${boldName}"`);
                    break;
                }

                // Check if bold text is a substring of product name or vice versa
                const boldInProduct = productNameLower.includes(boldName);
                const productInBold = boldName.includes(productNameLower);

                if (boldInProduct || productInBold) {
                    // Calculate how close the match is (penalize if lengths differ a lot)
                    const lengthDiff = Math.abs(productNameLower.length - boldName.length);
                    const matchScore = 150 - lengthDiff * 2; // More penalty for bigger length diff

                    if (matchScore > score) {
                        score = Math.max(matchScore, 50); // Min score of 50 for substring match
                        matchedBoldName = boldName;
                        console.log(`📍 Substring match: "${p.name}" ~ "${boldName}" (diff: ${lengthDiff}, score: ${score})`);
                    }
                    continue; // Don't process further for this boldName
                }

                // Key words matching (jacket, scarf, sweater, etc.)
                const boldKeywords = boldWords.filter(w => productTypeKeywords.includes(w));
                const productKeywords = productNameWords.filter(w => productTypeKeywords.includes(w));
                const keywordMatches = boldKeywords.filter(k => productKeywords.includes(k));

                // If product type matches (e.g., both are "jacket" or "scarf")
                if (keywordMatches.length > 0) {
                    // Check for additional word matches (color, material)
                    const otherBoldWords = boldWords.filter(w => !productTypeKeywords.includes(w) && w.length > 2);
                    const matchingOtherWords = otherBoldWords.filter(w =>
                        productNameLower.includes(w) || productNameWords.some(pw => pw.includes(w) || w.includes(pw))
                    );

                    if (matchingOtherWords.length >= 1) {
                        // Good match: product type + at least 1 other word
                        const newScore = 60 + keywordMatches.length * 15 + matchingOtherWords.length * 10;
                        if (newScore > score) {
                            score = newScore;
                            matchedBoldName = boldName;
                            console.log(`🔍 Product "${p.name}": type match [${keywordMatches}] + words [${matchingOtherWords}]`);
                        }
                    }
                }

                // Fallback: partial word matching (at least 2 significant words)
                if (score < 50) {
                    const significantBoldWords = boldWords.filter(w => w.length > 3);
                    const matchingWords = significantBoldWords.filter(w =>
                        productNameLower.includes(w) || productNameWords.some(pw => pw === w)
                    );
                    if (matchingWords.length >= 2) {
                        const newScore = 40 + matchingWords.length * 10;
                        if (newScore > score) {
                            score = newScore;
                            matchedBoldName = boldName;
                        }
                    }
                }
            }

            if (score > 0) {
                console.log(`✅ Product "${p.name}" matched "${matchedBoldName}" with score ${score}`);
            }

            // Medium score if product name appears anywhere in the answer
            if (score === 0 && answerLower.includes(productNameLower)) {
                score = 30;
                console.log(`📝 Product "${p.name}" found in answer text (score: 30)`);
            }

            // Bonus for color-matched products
            if (colorMatchedProductIds.includes(p._id.toString())) {
                score += 20;
            }

            return { product: p, score };
        });

        // Sort by score descending
        scoredProducts.sort((a, b) => b.score - a.score);

        // Only include products with score > 0 (mentioned in answer), or top 3 if none match
        let filteredProducts = scoredProducts.filter(sp => sp.score > 0).map(sp => sp.product);

        if (filteredProducts.length === 0) {
            // Fallback: use top products from orderedProducts
            filteredProducts = orderedProducts.slice(0, 3);
            console.log(`ℹ️ No products matched answer, using fallback products`);
        } else {
            console.log(`✅ Found ${filteredProducts.length} products mentioned in answer`);
        }

        // Replace orderedProducts with filtered ones
        orderedProducts.length = 0;
        orderedProducts.push(...filteredProducts);

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
