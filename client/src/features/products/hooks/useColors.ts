import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/core/lib/queryClient';
import * as colorService from '@/features/products/api/colorService';
import type { IColor } from '@/features/products/types';

/**
 * Color Hooks
 * React Query hooks for color operations
 */

// Cache time constants
const STALE_TIMES = {
    COLORS: 30 * 60 * 1000, // 30 minutes - colors rarely change
} as const;

/**
 * Hook to fetch all colors
 */
export const useColors = () => {
    return useQuery<IColor[]>({
        queryKey: queryKeys.colors.list(),
        queryFn: () => colorService.getAllColors(),
        staleTime: STALE_TIMES.COLORS,
    });
};
