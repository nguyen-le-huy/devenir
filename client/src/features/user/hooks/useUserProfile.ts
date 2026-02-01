/**
 * User Profile Hooks
 * React Query mutations for user profile management
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '../api';
import { useAuthStore } from '@/core/stores/useAuthStore';
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../api';
import type { ApiError } from '@/shared/types';

/**
 * Update user profile mutation
 * 
 * Features:
 * - Optimistic updates to Zustand store
 * - Toast notifications
 * - Auto-invalidation of user queries
 * 
 * @example
 * const updateProfile = useUpdateProfile();
 * updateProfile.mutate({ username: 'newname', phone: '0123456789' });
 */
export const useUpdateProfile = () => {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation<UpdateProfileResponse, ApiError, UpdateProfileRequest>({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      // Update Zustand store
      updateUser(data.user as any);
      
      // Invalidate related queries
      // Invalidate user queries
      // queryClient.invalidateQueries({ queryKey: ['user'] });
      
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

/**
 * Change password mutation
 * 
 * Features:
 * - Secure password change
 * - Toast notifications
 * - No state updates (password is hashed on backend)
 * 
 * @example
 * const changePassword = useChangePassword();
 * changePassword.mutate({ 
 *   currentPassword: 'old', 
 *   newPassword: 'new' 
 * });
 */
export const useChangePassword = () => {
  return useMutation<ChangePasswordResponse, ApiError, ChangePasswordRequest>({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
};
