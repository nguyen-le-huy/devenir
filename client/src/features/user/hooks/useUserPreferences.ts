/**
 * User Preferences Hooks
 * React Query mutations for user preferences management
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '../api';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { queryKeys } from '@/core/lib/queryClient';
import type { UpdatePreferencesRequest, UpdatePreferencesResponse } from '../api';
import type { ApiError } from '@/shared/types';

/**
 * Update user preferences mutation
 * 
 * Features:
 * - Updates marketing channels and interests
 * - Optimistic updates to Zustand store
 * - Toast notifications
 * 
 * @example
 * const updatePreferences = useUpdatePreferences();
 * updatePreferences.mutate({
 *   channels: { email: true, phone: false },
 *   interests: 'menswear'
 * });
 */
export const useUpdatePreferences = () => {
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation<UpdatePreferencesResponse, ApiError, UpdatePreferencesRequest>({
    mutationFn: userApi.updatePreferences,
    onSuccess: (data) => {
      // Update Zustand store with new user data
      updateUser(data.user);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users?.all });
      
      toast.success('Preferences updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });
};
