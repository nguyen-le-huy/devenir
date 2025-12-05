import { VectorStore } from '../core/VectorStore.js';

const vectorStore = new VectorStore();

/**
 * Search products by semantic similarity
 */
export async function searchProducts(query, options = {}) {
    const filter = {
        type: { $eq: 'product_info' },
        ...options.filter
    };

    const results = await vectorStore.search(query, {
        topK: options.topK || 50,
        filter,
        includeMetadata: true
    });

    return results;
}

/**
 * Search by category
 */
export async function searchByCategory(query, categoryName) {
    return searchProducts(query, {
        filter: { category: { $eq: categoryName } }
    });
}

/**
 * Search in-stock products only
 */
export async function searchInStock(query) {
    return searchProducts(query, {
        filter: { in_stock: { $eq: true } }
    });
}

/**
 * Search products with price range
 */
export async function searchByPriceRange(query, minPrice, maxPrice) {
    return searchProducts(query, {
        filter: {
            min_price: { $gte: minPrice },
            max_price: { $lte: maxPrice }
        }
    });
}

/**
 * Search products by brand
 */
export async function searchByBrand(query, brandName) {
    return searchProducts(query, {
        filter: { brand: { $eq: brandName } }
    });
}

/**
 * General vector search (for custom queries)
 */
export async function vectorSearch(query, options = {}) {
    return vectorStore.search(query, options);
}
