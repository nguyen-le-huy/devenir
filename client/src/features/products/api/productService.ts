import apiClient from '@/core/api/apiClient';
import type {
    IProduct,
    IVariant,
    IEnrichedVariant,
    IProductInfo,
    IProductListParams,
    IApiResponse,
    IVariantDetailResponse,
    ICategory,
} from '@/features/products/types';

/**
 * Product Service - API calls for product operations
 * All functions use proper TypeScript types and follow best practices
 */

// ============================================
// Constants
// ============================================

const FETCH_LIMITS = {
    ALL_VARIANTS: 1000,
    LATEST_POOL: 50,
    RANDOM_POOL: 100,
    CONCURRENCY: 5, // Limit requests to avoid N+1 choking
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Extract product info for embedding in variants
 */
const extractProductInfo = (product: IProduct): IProductInfo => ({
    _id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    brand: product.brand,
    averageRating: product.averageRating,
});

/**
 * Enrich variants with product information
 */
const enrichVariantsWithProductInfo = (
    variants: IVariant[],
    product: IProduct
): IEnrichedVariant[] => {
    const productInfo = extractProductInfo(product);
    return variants.map((variant) => ({
        ...variant,
        productInfo,
    }));
};

/**
 * Fetch variants for multiple products with concurrency control
 * Handles errors gracefully with fallback to empty arrays
 */
const fetchVariantsForProducts = async (
    products: IProduct[]
): Promise<IEnrichedVariant[]> => {
    // Defines the mapper function
    const mapper = async (product: IProduct) => {
        try {
            // Note: explicit cast because apiClient interceptor returns data directly (stripping AxiosResponse)
            const response = await apiClient.get(`/products/${product._id}/variants`) as unknown as IApiResponse<IVariant[]>;
            const variants = response.data || [];
            return { product, variants };
        } catch (error) {
            console.warn(`Failed to fetch variants for product ${product._id}`, error);
            // Return empty variants on failure to keep the UI working
            return { product, variants: [] as IVariant[] };
        }
    };

    // Concurrency limiter implementation
    // We execute promises in batches to respect FETCH_LIMITS.CONCURRENCY
    const results: { product: IProduct; variants: IVariant[] }[] = [];
    const queue = [...products];

    // Helper to process queue
    async function worker() {
        while (queue.length > 0) {
            const product = queue.shift();
            if (product) {
                const result = await mapper(product);
                results.push(result);
            }
        }
    }

    // Start workers
    const workerPromises = Array(Math.min(products.length, FETCH_LIMITS.CONCURRENCY))
        .fill(null)
        .map(() => worker());

    await Promise.all(workerPromises);

    return results.flatMap(({ product, variants }) =>
        enrichVariantsWithProductInfo(variants, product)
    );
};

/**
 * Filter to keep only one variant per product+color combination
 */
const filterUniqueByProductColor = (
    variants: IEnrichedVariant[]
): IEnrichedVariant[] => {
    const uniqueMap = new Map<string, boolean>();

    return variants.filter((variant) => {
        const productId = variant.productInfo?._id || variant.product_id;
        const key = `${productId}_${variant.color}`;

        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, true);
            return true;
        }
        return false;
    });
};

// ============================================
// API Functions - Simple Delegates
// ============================================

/**
 * Get all products with pagination and filtering
 */
export const getAllProducts = (
    params: IProductListParams = {}
): Promise<IApiResponse<IProduct[]>> =>
    apiClient.get('/products', { params }) as Promise<IApiResponse<IProduct[]>>;

/**
 * Get product by ID with variants
 */
export const getProductById = (id: string): Promise<IApiResponse<IProduct>> =>
    apiClient.get(`/products/${id}`) as Promise<IApiResponse<IProduct>>;

/**
 * Get variants for a specific product
 */
export const getProductVariants = (
    productId: string
): Promise<IApiResponse<IVariant[]>> =>
    apiClient.get(`/products/${productId}/variants`) as Promise<IApiResponse<IVariant[]>>;

/**
 * Get all variants with optional filtering
 */
export const getAllVariants = (
    params: Record<string, unknown> = {}
): Promise<IApiResponse<IVariant[]>> =>
    apiClient.get('/variants', { params }) as Promise<IApiResponse<IVariant[]>>;

// ============================================
// API Functions - Complex with Data Transformation
// ============================================

/**
 * Get all variants for a category
 * Each variant is enriched with product information
 */
export const getVariantsByCategory = async (
    categoryId: string
): Promise<IEnrichedVariant[]> => {
    const productsResponse = await apiClient.get('/products', {
        params: {
            category: categoryId,
            limit: FETCH_LIMITS.ALL_VARIANTS,
        },
    }) as unknown as IApiResponse<IProduct[]>;

    const products = productsResponse.data || [];

    if (products.length === 0) {
        return [];
    }

    return fetchVariantsForProducts(products);
};

/**
 * Get variants for a category AND its subcategories
 */
export const getVariantsByCategoryWithChildren = async (
    parentCategoryId: string,
    allCategories: ICategory[] = []
): Promise<IEnrichedVariant[]> => {
    // Find all subcategory IDs
    const subcategories = allCategories.filter((cat) => {
        const parentId =
            typeof cat.parentCategory === 'object'
                ? cat.parentCategory?._id
                : cat.parentCategory;
        return String(parentId) === String(parentCategoryId);
    });

    // Collect all category IDs (parent + children)
    const allCategoryIds = [parentCategoryId, ...subcategories.map((sub) => sub._id)];

    // Fetch variants from all categories in parallel
    const results = await Promise.allSettled(
        allCategoryIds.map((categoryId) => getVariantsByCategory(categoryId))
    );

    const allVariants: IEnrichedVariant[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allVariants.push(...result.value);
        }
    });

    return allVariants;
};

/**
 * Get variant by ID with detailed info
 * Returns variant, parent product, and sibling variants
 */
export const getVariantById = async (
    variantId: string
): Promise<IVariantDetailResponse> => {
    const response = await apiClient.get(`/variants/${variantId}`) as unknown as IApiResponse<IVariantDetailResponse>;
    const data = response; // data is effectively the response object because of interceptor? Wait.

    // Interceptor: returns response.data
    // So response IS { success: ..., data: ... }

    if (data.success && data.data) {
        return data.data;
    }

    // Fallback?
    return data as unknown as IVariantDetailResponse;
};

/**
 * Get latest variants (sorted by createdAt)
 * Returns unique variants per product+color combination
 */
export const getLatestVariants = async (
    limit = 4
): Promise<IEnrichedVariant[]> => {
    const productsResponse = await apiClient.get('/products', {
        params: {
            limit: FETCH_LIMITS.LATEST_POOL,
            sort: '-createdAt',
        },
    }) as unknown as IApiResponse<IProduct[]>;

    const products = productsResponse.data || [];

    if (products.length === 0) {
        return [];
    }

    const allVariants = await fetchVariantsForProducts(products);

    // Sort by createdAt (newest first)
    const sortedVariants = allVariants.sort((a, b) => {
        const dateA = new Date(a.createdAt || a._id).getTime();
        const dateB = new Date(b.createdAt || b._id).getTime();
        return dateB - dateA;
    });

    // Filter unique and slice to limit
    return filterUniqueByProductColor(sortedVariants).slice(0, limit);
};

/**
 * Get random variants for product suggestions
 * Returns unique variants per product+color combination
 */
export const getRandomVariants = async (
    limit = 8
): Promise<IEnrichedVariant[]> => {
    const productsResponse = await apiClient.get('/products', {
        params: {
            limit: FETCH_LIMITS.RANDOM_POOL,
        },
    }) as unknown as IApiResponse<IProduct[]>;

    const products = productsResponse.data || [];

    if (products.length === 0) {
        return [];
    }

    const allVariants = await fetchVariantsForProducts(products);

    // Filter unique
    const uniqueVariants = filterUniqueByProductColor(allVariants);

    // Shuffle array for randomness
    const shuffled = uniqueVariants.sort(() => Math.random() - 0.5);

    return shuffled.slice(0, limit);
};
