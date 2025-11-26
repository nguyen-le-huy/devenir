import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient.js';
import * as colorService from '../services/colorService.js';

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
