import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/core/lib/queryClient';
import * as colorService from '@/features/products/api/colorService';

/**
 * Hook to fetch all colors
 */
export const useColors = () => {
    return useQuery({
        queryKey: queryKeys.colors.list(),
        queryFn: () => colorService.getAllColors(),
        staleTime: 30 * 60 * 1000, // 30 minutes - colors rarely change
    });
};
