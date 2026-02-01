/**
 * User Feature - TypeScript Types
 * Strict type definitions for user-related data structures
 */

/**
 * User entity from backend
 */
export interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  role: 'customer' | 'admin';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  avatar?: string;
}

/**
 * User preferences for marketing and communications
 */
export interface UserPreferences {
  channels: {
    email: boolean;
    phone: boolean;
    messaging: boolean;
    post: boolean;
  };
  interests: 'menswear' | 'womenswear' | 'both';
}

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
}
