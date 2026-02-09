import { openai, MODELS } from '../../../config/openai.js';
import Product from '../../../models/ProductModel.js';
import ProductVariant from '../../../models/ProductVariantModel.js';

import { searchProducts } from '../retrieval/vector-search.service.js';
import { buildEnterpriseSizeAdvisorPrompt } from '../generation/prompts/size-advisor.prompt.js';
import { productKnowledgeService } from '../knowledge/product-knowledge.service.js';

/**
 * Size recommendation service
 * @param {string} query - User query about size
 * @param {Object} extractedInfo - Extracted info from intent classifier
 * @param {Object} context - Conversation context
 */
export async function sizeRecommendation(query, extractedInfo = {}, context = {}) {
    try {
        console.log('🎯 Size Advisor - Enhanced Mode');
        console.log('  Query:', query);
        console.log('  Context entities:', context.entities?.current_product?.name || 'None');
        console.log('  Extracted height:', extractedInfo.height, 'weight:', extractedInfo.weight);

        // PRIORITY 1: Check for explicit product in CURRENT query
        // This overrides sticky context from previous turns
        let productId = null;
        let productName = null;

        // 🆕 ENHANCED: Multi-tier product search strategy
        // Tier 1: MongoDB Text Search (exact/fuzzy name match)
        // Tier 2: MongoDB Regex Search (partial name match)
        // Tier 3: Vector Search (semantic similarity)

        try {
            // Extract potential product name from query
            // Remove common size-related keywords
            const cleanQuery = query
                .replace(/(tôi|mình|em|bạn|cao|nặng|size|kích cỡ|thước|cho|thì|nên|lấy|chọn|mặc|vừa|không|có|bao nhiêu|như thế nào|là gì|cm|kg|m\d+)/gi, ' ')
                .replace(/\d+\s*(cm|kg|m)/gi, '') // Remove measurements
                .trim();

            console.log(`🔍 Extracted product query: "${cleanQuery}" (from: "${query}")`);

            if (cleanQuery.length > 5) {
                // === TIER 1: MongoDB Text Search (Fast, exact/fuzzy match) ===
                console.log('🔍 Tier 1: Trying MongoDB text search...');
                const textSearchResults = await Product.find(
                    { $text: { $search: cleanQuery } },
                    { score: { $meta: 'textScore' } }
                )
                    .sort({ score: { $meta: 'textScore' } })
                    .limit(1)
                    .lean();

                if (textSearchResults && textSearchResults.length > 0) {
                    const bestMatch = textSearchResults[0];
                    // Text search score > 1.0 is usually a good match
                    if (bestMatch.score > 0.8) {
                        productId = bestMatch._id;
                        productName = bestMatch.name;
                        console.log(`✅ Tier 1 SUCCESS: Found "${productName}" (text score: ${bestMatch.score.toFixed(2)})`);
                    }
                }

                // === TIER 2: MongoDB Regex Search (Fallback for partial matches) ===
                if (!productId && cleanQuery.length > 8) {
                    console.log('🔍 Tier 2: Trying MongoDB regex search...');
                    const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 3);

                    if (keywords.length > 0) {
                        // Create regex pattern matching all keywords (order-independent)
                        const regexPattern = keywords.map(k => `(?=.*${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');
                        const regex = new RegExp(regexPattern, 'i');

                        const regexResults = await Product.find({
                            name: regex,
                            isActive: true
                        })
                            .limit(3)
                            .lean();

                        if (regexResults && regexResults.length > 0) {
                            // Score by name length (shorter = more specific match)
                            const scoredResults = regexResults.map(p => ({
                                product: p,
                                score: 1000 - p.name.length // Prefer shorter names
                            }));
                            scoredResults.sort((a, b) => b.score - a.score);

                            const bestMatch = scoredResults[0].product;
                            productId = bestMatch._id;
                            productName = bestMatch.name;
                            console.log(`✅ Tier 2 SUCCESS: Found "${productName}" via regex`);
                        }
                    }
                }

                // === TIER 3: Vector Search (Semantic similarity fallback) ===
                if (!productId) {
                    console.log('🔍 Tier 3: Trying vector search...');
                    const searchResults = await searchProducts(cleanQuery, 1);
                    if (searchResults && searchResults.length > 0) {
                        // Lower threshold for vector search since previous tiers failed
                        if (searchResults[0].score > 0.75) {
                            productId = searchResults[0].id;
                            productName = searchResults[0].name;
                            console.log(`✅ Tier 3 SUCCESS: Found "${productName}" (vector score: ${searchResults[0].score})`);
                        } else {
                            console.log(`⚠️ Tier 3: Vector score too low (${searchResults[0].score}) for "${searchResults[0].name}"`);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('❌ Error in multi-tier product search:', err);
        }

        // PRIORITY 2: Fallback to context/extracted info if no explicit product found
        if (!productId) {
            productId = context.entities?.current_product?.id ||
                extractedInfo.product_id ||
                context.recent_product_id;
            productName = context.entities?.current_product?.name || null;
            if (productId) console.log('📎 Using context product:', productName);
        }

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

        // === ENTERPRISE UPGRADE: Use Product Knowledge + Advanced Prompting ===

        // Get deep product knowledge
        const productKnowledge = await productKnowledgeService.getProductKnowledge(
            productId,
            product.name
        );
        console.log(`📚 Product Knowledge: ${productKnowledge.material}, ${productKnowledge.fitType}`);

        // Build user measurements object
        const userMeasurements = {
            height: extractedInfo.height || context.entities?.user_measurements?.height,
            weight: extractedInfo.weight || context.entities?.user_measurements?.weight,
            chest: extractedInfo.chest || context.entities?.user_measurements?.chest,
            waist: extractedInfo.waist || context.entities?.user_measurements?.waist,
            shoulder: extractedInfo.shoulder || context.entities?.user_measurements?.shoulder,
            usual_size: extractedInfo.usual_size || context.entities?.user_measurements?.usual_size
        };

        // DEBUG: Log detailed measurement sources
        console.log('📊 Measurements Debug:');
        console.log('  extractedInfo:', JSON.stringify(extractedInfo));
        console.log('  context.entities?.user_measurements:', JSON.stringify(context.entities?.user_measurements || {}));
        console.log('  Final userMeasurements:', JSON.stringify(userMeasurements));

        // === EARLY RETURN: Request measurements if missing critical data ===
        const missingMeasurements = [];
        if (!userMeasurements.height) missingMeasurements.push('chiều cao');
        if (!userMeasurements.weight) missingMeasurements.push('cân nặng');

        if (missingMeasurements.length > 0) {
            console.log(`⚠️ Missing critical measurements: ${missingMeasurements.join(', ')}`);

            let answer = `**Tư vấn size cho ${product.name}**\n\n`;
            answer += `Để tư vấn size chính xác nhất, mình cần một số thông tin từ bạn:\n\n`;

            answer += `📏 **Vui lòng cung cấp:**\n`;
            if (!userMeasurements.height) {
                answer += `• **Chiều cao** của bạn (ví dụ: 170cm, 1m75)\n`;
            }
            if (!userMeasurements.weight) {
                answer += `• **Cân nặng** của bạn (ví dụ: 65kg, 70kg)\n`;
            }
            answer += `\n`;

            answer += `💡 **Thông tin bổ sung (không bắt buộc nhưng sẽ tư vấn chính xác hơn):**\n`;
            answer += `• Vòng ngực\n`;
            answer += `• Rộng vai\n`;
            if (product.category?.name === 'Pants' || product.category?.name === 'Quần') {
                answer += `• Vòng eo\n`;
            }
            answer += `\n`;

            answer += `Sau khi có thông tin, mình sẽ tư vấn size phù hợp nhất dựa trên:\n`;
            answer += `✓ Bảng size chuẩn DEVENIR\n`;
            answer += `✓ Đặc tính chất liệu sản phẩm\n`;
            answer += `✓ Kiểu dáng và fit\n\n`;

            answer += `Bạn có thể nhập như: "Cao 175cm nặng 70kg" nhé! 😊`;

            return {
                answer,
                requires_measurements: true,
                missing_fields: missingMeasurements,
                product_info: {
                    _id: product._id,
                    name: product.name,
                    urlSlug: product.urlSlug
                }
            };
        }
        // === END EARLY RETURN ===

        // Enrich product object with available sizes for prompt
        const enrichedProduct = {
            ...product,
            availableSizes: availableSizes
        };

        // Build enterprise-grade prompt
        const prompt = buildEnterpriseSizeAdvisorPrompt({
            product: enrichedProduct,
            userMeasurements,
            conversationContext: context,
            productKnowledge
        });

        console.log(`📝 Using Enterprise Size Advisor Prompt (${prompt.length} chars)`);
        // === END ENTERPRISE UPGRADE ===

        // Call LLM with enterprise prompt
        const response = await openai.chat.completions.create({
            model: MODELS.CHAT,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2, // Low temperature for consistent, accurate recommendations
            max_tokens: 1000 // Allow detailed responses
        });

        const result = JSON.parse(response.choices[0].message.content);
        console.log(`✨ LLM Recommendation: ${result.recommended_size} (confidence: ${result.confidence || 'N/A'})`);

        // Validate recommendation is from available sizes
        if (!availableSizes.includes(result.recommended_size)) {
            console.warn(`⚠️ LLM recommended unavailable size ${result.recommended_size}, falling back to closest match`);
            result.recommended_size = this.findClosestSize(result.recommended_size, availableSizes);
        }

        // Get variants of recommended size
        const recommendedVariants = variants.filter(v => v.size === result.recommended_size);

        // Build professional answer using enterprise response structure
        let answer = `**Tư vấn size cho ${product.name}**\n\n`;

        // Main recommendation
        answer += `📏 **Đề xuất: Size ${result.recommended_size}**`;
        if (result.confidence) {
            const confidenceLabel = result.confidence >= 0.9 ? ' (Rất phù hợp)' :
                result.confidence >= 0.7 ? ' (Phù hợp)' :
                    ' (Cần cân nhắc)';
            answer += confidenceLabel;
        }
        answer += `\n\n`;

        // Reasoning - ONLY primary factor for brevity
        if (result.reasoning && typeof result.reasoning === 'object') {
            if (result.reasoning.primary_factor) {
                answer += `${result.reasoning.primary_factor}\n\n`;
            }
        } else if (result.reason) {
            answer += `${result.reason}\n\n`;
        }

        // Specific advice - LIMIT to top 2 most important
        if (result.specific_advice && Array.isArray(result.specific_advice)) {
            const topAdvice = result.specific_advice.slice(0, 2); // Only first 2
            if (topAdvice.length > 0) {
                answer += `**⚠️ Lưu ý:**\n`;
                topAdvice.forEach(advice => {
                    answer += `• ${advice}\n`;
                });
                answer += `\n`;
            }
        } else if (result.fit_note) {
            answer += `**⚠️ Lưu ý:** ${result.fit_note}\n\n`;
        }

        // Alternative size - COMPACT format
        if (result.alternative_size && result.alternative_reasoning) {
            answer += `**Size thay thế:** ${result.alternative_size}\n`;
            // Shorten alternative reasoning if too long
            const shortReasoning = result.alternative_reasoning.length > 120
                ? result.alternative_reasoning.substring(0, 120) + '...'
                : result.alternative_reasoning;
            answer += `${shortReasoning}\n\n`;
        }

        // Try both recommendation - SKIP if low value
        // Only show if confidence is borderline (0.6-0.8)
        if (result.try_both_recommendation === 'Có' && result.confidence && result.confidence >= 0.6 && result.confidence <= 0.8) {
            answer += `💡 Gợi ý thử cả 2 size để chọn size vừa nhất.\n\n`;
        }

        // Available variants
        if (recommendedVariants.length > 0) {
            answer += `**Có sẵn size ${result.recommended_size}:**\n`;
            recommendedVariants.slice(0, 3).forEach(v => { // Max 3 variants
                answer += `• ${v.color}: $${v.price}${v.quantity < 5 ? ' (Còn ít)' : ''}\n`;
            });
            answer += `\n`;
        }

        // Measurement request - COMPACT format
        if (result.measurement_request && result.measurement_request.needed) {
            const fieldTranslations = {
                'shoulder_width': 'Rộng vai',
                'chest': 'Vòng ngực',
                'waist': 'Vòng eo',
                'height': 'Chiều cao',
                'weight': 'Cân nặng',
                'hip': 'Vòng hông',
                'inseam': 'Chiều dài chân'
            };

            const translatedFields = result.measurement_request.needed
                .map(field => fieldTranslations[field] || field)
                .join(', ');

            answer += `📐 **Để tư vấn tốt hơn:** ${translatedFields}\n\n`;
            // REMOVE long reason explanation for brevity
        }

        answer += `🛍️ Bạn có muốn thêm sản phẩm vào giỏ hàng?`;

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
