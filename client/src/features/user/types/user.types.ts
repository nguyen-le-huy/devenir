/**
 * User Feature - TypeScript Types
 * Strict type definitions for user-related data structures
 */

import type { User, UserPreferences } from '@/features/auth/types';

// Re-export types
export type { User, UserPreferences };

/**
 * Payload for updating user profile
 */
export interface UserProfileUpdatePayload {
  username?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
}

/**
 * Payload for changing password
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/**
 * Payload for updating preferences
 */
export interface UserPreferencesPayload {
  channels?: Partial<UserPreferences['channels']>;
  interests?: UserPreferences['interests'];
}

/**
 * API Response wrapper
 */
export interface UserApiResponse {
  success: boolean;
  user: User;
  message?: string;
}

/**
 * Component Props Types
 */
export interface PersonalDetailsProps {
  user: User;
}

export interface MarketingPreferencesProps {
  user: User;
}

export interface ProfileOverviewProps {
  user: User;
  onEditProfile: () => void;
  onEditPreferences: () => void;
}
