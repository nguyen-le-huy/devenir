import apiClient from '@/core/api/apiClient';
import type { ICategory, IApiResponse } from '@/features/products/types';

/**
 * Category Service
 * API calls for category operations
 */

// ============================================
// Constants
// ============================================

const FETCH_LIMITS = {
    MAX_CATEGORIES: 50,
} as const;

// ============================================
// Types
// ============================================

interface CategoryListParams {
    page?: number;
    limit?: number;
    parentCategory?: string;
    isActive?: boolean;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all categories with optional filtering
 */
export const getAllCategories = async (
    params: CategoryListParams = {}
): Promise<IApiResponse<ICategory[]>> => {
    const response = await apiClient.get<IApiResponse<ICategory[]>>('/categories', {
        params,
    });
    return response as unknown as IApiResponse<ICategory[]>;
};

/**
 * Get category by ID
 */
export const getCategoryById = async (
    id: string
): Promise<IApiResponse<ICategory>> => {
    const response = await apiClient.get<IApiResponse<ICategory>>(
        `/categories/${id}`
    );
    return response as unknown as IApiResponse<ICategory>;
};

/**
 * Get main (top-level) active categories
 * Filters out categories with parent
 */
export const getMainCategories = async (): Promise<IApiResponse<ICategory[]>> => {
    const response = await apiClient.get<IApiResponse<ICategory[]>>('/categories', {
        params: {
            isActive: true,
            limit: FETCH_LIMITS.MAX_CATEGORIES,
        },
    });

    const data = response as unknown as IApiResponse<ICategory[]>;

    // Filter to keep only top-level categories (no parent)
    if (data.data) {
        const mainCategories = data.data.filter((cat) => !cat.parentCategory);
        return {
            ...data,
            data: mainCategories,
        };
    }

    return data;
};
