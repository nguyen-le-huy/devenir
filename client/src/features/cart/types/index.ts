import { IProduct, IVariant } from '@/features/products/types';

// Re-export for convenience
export type { IProduct };

/**
 * Product Variant Interface - Extended from products feature
 * Added cart-specific fields
 */
export interface IProductVariant extends IVariant {
    product_id: IProduct; // Populated product reference
    color: {
        _id?: string;
        name: string;
        code?: string;
    } | string; // Handle both populated object or string ID/name
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
