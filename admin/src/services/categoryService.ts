import { api } from './api'

export interface Category {
    _id: string
    name: string
    description?: string
    thumbnailUrl?: string
    slug: string // SEO-friendly URL (required, unique, auto-generated)
    parentCategory?: string | null
    isActive: boolean
    sortOrder?: number // Display order
    productCount?: number // Number of products in this category
    createdAt: string
    updatedAt: string
}

export interface CategoryFormData {
    name: string
    description?: string
    thumbnailUrl?: string
    slug?: string // Optional: auto-generated from name if not provided
    parentCategory?: string | null
    isActive: boolean
    sortOrder?: number
}

export const categoryService = {
    /**
     * Get categories as hierarchical tree with levels
     */
    getCategoriesTree: async () => {
        const response = await api.get('/categories/tree')
        return response.data
    },

    /**
     * Get all categories with pagination and filters
     */
    getAllCategories: async (params?: {
        page?: number
        limit?: number
        parentCategory?: string
        isActive?: boolean
    }) => {
        const response = await api.get('/categories', { params })
        return response.data
    },

    /**
     * Get category by ID with children
     */
    getCategoryById: async (id: string) => {
        const response = await api.get(`/categories/${id}`)
        return response.data
    },

    /**
     * Create new category (Admin only)
     */
    createCategory: async (data: CategoryFormData) => {
        const response = await api.post('/categories/admin', data)
        return response.data
    },

    /**
     * Update category (Admin only)
     */
    updateCategory: async (id: string, data: Partial<CategoryFormData>) => {
        const response = await api.put(`/categories/admin/${id}`, data)
        return response.data
    },

    /**
     * Delete category (Admin only)
     */
    deleteCategory: async (id: string) => {
        const response = await api.delete(`/categories/admin/${id}`)
        return response.data
    },
}
