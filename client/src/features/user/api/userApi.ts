/**
 * User API Layer
 * Centralized API calls for user profile management
 */

import apiClient from '@/core/api/apiClient';
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
} from './userApi.types';

/**
 * User API Service
 * All HTTP requests related to user profile
 */
export const userApi = {
  /**
   * Update user profile information
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await apiClient.put('/api/users/profile', data);
    return response.data;
  },

  /**
   * Change user password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await apiClient.put('/api/users/change-password', data);
    return response.data;
  },

  /**
   * Update user marketing preferences
   */
  updatePreferences: async (data: UpdatePreferencesRequest): Promise<UpdatePreferencesResponse> => {
    const response = await apiClient.put('/api/users/preferences', data);
    return response.data;
  },
};

export default userApi;
