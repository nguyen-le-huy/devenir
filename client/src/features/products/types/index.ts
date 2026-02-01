/**
 * Product Types
 * Centralized type definitions for the products feature
 */

// ============================================
// Base Entities
// ============================================

export interface ICategory {
    _id: string;
    name: string;
    slug: string;
    parentCategory?: string | ICategory;
    isActive: boolean;
}

export interface IBrand {
    _id: string;
    name: string;
    slug: string;
}

export interface IColor {
    _id: string;
    name: string;
    hex: string; // Matches API field name
    isActive?: boolean;
}

// ============================================
// Product & Variant
// ============================================

export interface IProduct {
    _id: string;
    name: string;
    description: string;
    category: ICategory;
    brand: IBrand;
    basePrice: number;
    averageRating: number;
    status: 'active' | 'inactive' | 'draft';
    createdAt: string;
    updatedAt: string;
}

export interface IVariant {
    _id: string;
    product_id: string;
    sku: string;
    price: number;
    basePrice: number;
    salePrice?: number;
    color: string;
    colorName?: string;
    size: string;
    stock: number;
    mainImage: string;
    hoverImage?: string;
    images: string[];
    createdAt?: string;
}

/**
 * Enriched variant with embedded product info
 * Used when fetching variants with product details
 */
export interface IEnrichedVariant extends IVariant {
    productInfo: IProductInfo;
}

export interface IProductInfo {
    _id: string;
    name: string;
    description: string;
    category: ICategory;
    brand: IBrand;
    averageRating: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface IProductListParams {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    status?: string;
    search?: string;
    sort?: string;
}

export interface IVariantListParams {
    color?: string;
    size?: string;
    product?: string;
}

export interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface IApiResponse<T> {
    success: boolean;
    data: T;
    pagination?: IPaginationMeta;
    message?: string;
}

export interface IProductListResponse extends IApiResponse<IProduct[]> { }

export interface IVariantDetailResponse {
    variant: IVariant;
    product: IProduct;
    siblingVariants: IVariant[];
}

// ============================================
// UI/Component Types
// ============================================

export interface IProductCardData {
    id: string;
    name: string;
    price: number;
    image: string;
    imageHover: string;
    color: string;
    size: string;
    sku: string;
}

export interface IGalleryData {
    mainImage: string;
    otherImages: string[];
    allGalleryImages: string[];
    isSingleImage: boolean;
    isFewImages: boolean;
}

// ============================================
// Color Map Type
// ============================================

export type ColorMap = Record<string, string>;

// ============================================
// Constants
// ============================================

export const PRODUCT_FETCH_LIMITS = {
    /** Maximum variants to fetch for a category */
    ALL_VARIANTS: 1000,
    /** Pool size for latest variants selection */
    LATEST_POOL: 50,
    /** Pool size for random variants selection */
    RANDOM_POOL: 100,
    /** Default items per page */
    DEFAULT_PAGE_SIZE: 20,
    /** Maximum categories to fetch */
    MAX_CATEGORIES: 50,
} as const;

export const CACHE_TIMES = {
    /** Stale time for category data (3 minutes) */
    CATEGORY_STALE: 3 * 60 * 1000,
    /** Stale time for product listings (5 minutes) */
    PRODUCT_STALE: 5 * 60 * 1000,
    /** Stale time for static data (10 minutes) */
    STATIC_STALE: 10 * 60 * 1000,
} as const;
