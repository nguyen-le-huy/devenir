import apiClient from '@/core/api/apiClient';
import type { IColor, IApiResponse, ColorMap } from '@/features/products/types';

/**
 * Color Service
 * API calls for color operations
 */

// ============================================
// Constants
// ============================================

const FETCH_LIMITS = {
    MAX_COLORS: 100,
} as const;



// ============================================
// API Functions
// ============================================

/**
 * Get all active colors
 */
export const getAllColors = async (): Promise<IColor[]> => {
    const response = await apiClient.get<IApiResponse<IColor[]>>('/colors', {
        params: {
            isActive: true,
            limit: FETCH_LIMITS.MAX_COLORS,
        },
    });

    return (response as unknown as IApiResponse<IColor[]>).data || [];
};

/**
 * Get color by name
 */
export const getColorByName = async (name: string): Promise<IColor[]> => {
    const response = await apiClient.get<IApiResponse<IColor[]>>('/colors', {
        params: {
            name,
            isActive: true,
        },
    });

    return (response as unknown as IApiResponse<IColor[]>).data || [];
};

// ============================================
// Utility Functions
// ============================================

/**
 * Create a color map from colors array
 * @returns Object mapping color name to hex code { colorName: hexCode }
 */
export const createColorMap = (colors: IColor[]): ColorMap => {
    const colorMap: ColorMap = {};

    colors.forEach((color) => {
        if (color.name && color.hex) {
            colorMap[color.name] = color.hex;
        }
    });

    return colorMap;
};
