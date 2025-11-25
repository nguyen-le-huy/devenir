import { api } from './api'

export interface Variant {
    id?: string
    _id?: string
    sku: string
    color: string
    size: string
    price: number
    quantity: number
    mainImage?: string
    hoverImage?: string
    images: string[]
    stock?: number
    lowStockThreshold?: number
}

export interface Product {
    _id: string
    name: string
    description: string
    category: string
    brand: string
    tags: string[]
    status: 'draft' | 'published' | 'archived'
    variants: Variant[]
    isActive: boolean
    averageRating: number
    seoTitle?: string
    seoDescription?: string
    urlSlug?: string
    createdAt: string
    updatedAt: string
}

export interface ProductFormData {
    name: string
    description: string
    category: string
    brand: string
    tags: string[]
    status: 'draft' | 'published' | 'archived'
    variants: Variant[]
    seoTitle?: string
    seoDescription?: string
    urlSlug?: string
}

export const productService = {
    /**
     * Get all products with pagination and filters
     */
    getAllProducts: async (params?: {
        page?: number
        limit?: number
        category?: string
        brand?: string
        status?: string
        search?: string
    }) => {
        const response = await api.get('/products', { params })
        return response.data
    },

    /**
     * Get product by ID with variants
     */
    getProductById: async (id: string) => {
        const response = await api.get(`/products/${id}`)
        return response.data
    },

    /**
     * Create new product (Admin only)
     */
    createProduct: async (data: ProductFormData) => {
        const response = await api.post('/admin/products', data)
        return response.data
    },

    /**
     * Update product (Admin only)
     */
    updateProduct: async (id: string, data: Partial<ProductFormData>) => {
        const response = await api.put(`/admin/products/${id}`, data)
        return response.data
    },

    /**
     * Delete product (Admin only)
     */
    deleteProduct: async (id: string) => {
        const response = await api.delete(`/admin/products/${id}`)
        return response.data
    },
}
