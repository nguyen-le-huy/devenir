/**
 * User API - Request/Response Types
 */

import type { User } from '../types';

/**
 * Update Profile Request
 */
export interface UpdateProfileRequest {
  username?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
}

/**
 * Update Profile Response
 */
export interface UpdateProfileResponse {
  success: boolean;
  user: User;
  message: string;
}

/**
 * Change Password Request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change Password Response
 */
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Update Preferences Request
 */
export interface UpdatePreferencesRequest {
  channels?: {
    email?: boolean;
    phone?: boolean;
    messaging?: boolean;
    post?: boolean;
  };
  interests?: 'menswear' | 'womenswear' | 'both';
}

/**
 * Update Preferences Response
 */
export interface UpdatePreferencesResponse {
  success: boolean;
  user: User;
  message: string;
}
