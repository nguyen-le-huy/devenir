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

// Vietnamese to English category mapping
const CATEGORY_KEYWORDS = {
    'nước hoa': 'Fragrances',
    'fragrance': 'Fragrances',
    'perfume': 'Fragrances',
    'eau de parfum': 'Fragrances',
    'cologne': 'Fragrances',
    'khăn': 'Scarves',
    'scarf': 'Scarves',
    'áo jacket': 'Jackets',
    'jacket': 'Jackets',
    'áo khoác': 'Jackets',
    'túi': 'Bags',
    'bag': 'Bags',
    'ví': 'Wallets',
    'wallet': 'Wallets',
    'áo len': 'Sweaters',
    'sweater': 'Sweaters',
    'áo sơ mi': 'Shirts',
    'shirt': 'Shirts',
    'cà vạt': 'Ties & Cufflinks',
    'tie': 'Ties & Cufflinks',
    'cufflink': 'Ties & Cufflinks'
};

/**
 * Fallback search by category in MongoDB
 * Used when vector search returns no results
 */
export async function searchByCategoryMongoDB(query) {
    // Lazy import to avoid circular dependency
    const Product = (await import('../../../models/ProductModel.js')).default;
    const Category = (await import('../../../models/CategoryModel.js')).default;

    const queryLower = query.toLowerCase();
    let categoryName = null;

    // Find matching category from keywords
    for (const [keyword, catName] of Object.entries(CATEGORY_KEYWORDS)) {
        if (queryLower.includes(keyword)) {
            categoryName = catName;
            console.log(`🔍 Matched keyword "${keyword}" → Category "${catName}"`);
            break;
        }
    }

    if (!categoryName) {
        return { products: [], answer: '', category: null };
    }

    // Find category by name
    const category = await Category.findOne({
        name: { $regex: new RegExp(categoryName, 'i') },
        isActive: true
    }).lean();

    if (!category) {
        console.log(`⚠️ Category "${categoryName}" not found in database`);
        return { products: [], answer: '', category: null };
    }

    // Find products in this category
    const products = await Product.find({
        category: category._id,
        isActive: true
    }).populate('category').lean();

    console.log(`📦 Found ${products.length} products in category "${category.name}"`);

    if (products.length === 0) {
        return { products: [], answer: '', category };
    }

    // Build answer
    const productNames = products.slice(0, 3).map(p => `**${p.name}**`).join(', ');
    const answer = `Có! Shop có bán ${category.name}. Hiện tại có ${products.length} sản phẩm, bao gồm: ${productNames}. Bạn muốn xem chi tiết sản phẩm nào?`;

    return {
        products,
        answer,
        category
    };
}
