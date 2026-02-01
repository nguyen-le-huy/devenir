// Product Interface (Core product info)
export interface IProduct {
    _id: string;
    name: string;
    description?: string;
    basePrice: number;
    slug?: string;
    category?: string;
    brand?: string;
    gender?: 'Male' | 'Female' | 'Unisex';
    images?: string[];
}

// Product Variant Interface (Specific Size/Color/Stock)
export interface IProductVariant {
    _id: string;
    product_id: IProduct; // Populated product reference
    size: string;
    color: {
        _id?: string;
        name: string;
        code?: string;
    } | string; // Handle both populated object or string ID/name
    price: number;
    stock: number;
    sku?: string;
    mainImage: string;
    // Computed/Virtual fields likely from backend or frontend calculation
    salePrice?: number;
    basePrice?: number; // Sometimes variants override basePrice
}

// Cart Item Interface
export interface ICartItem {
    _id: string;
    productVariant: IProductVariant;
    quantity: number;
    addedAt?: string;
    // For backward compatibility if 'variant' is used or 'product' is flattened
    variant?: IProductVariant;
    product?: IProduct;
}

// Cart Interface
export interface ICart {
    _id: string;
    user: string;
    items: ICartItem[];
    totalItems: number;
    totalPrice: number;
    createdAt?: string;
    updatedAt?: string;
}

// API Response Wrappers
export interface ICartResponse {
    success: boolean;
    message?: string;
    data: ICart;
}

// Operation Payloads
export interface IAddToCartPayload {
    variantId: string;
    quantity: number;
}

export interface IUpdateCartItemPayload {
    variantId: string;
    quantity: number;
}
