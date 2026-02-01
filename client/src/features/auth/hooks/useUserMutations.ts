import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import { ResetPasswordData, ChangePasswordData, UserProfileData, User } from '../types';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { ApiError } from '@/shared/types';
import { AUTH_MESSAGES } from '../constants';

/**
 * Reset Password Mutation
 */
interface ResetPasswordPayload {
    token: string;
    data: ResetPasswordData;
}

export const useResetPassword = () => {
    const navigate = useNavigate();

    return useMutation<void, ApiError, ResetPasswordPayload>({
        mutationFn: ({ token, data }) => authService.resetPassword(token, data),
        onSuccess: () => {
            toast.success(AUTH_MESSAGES.PASSWORD_RESET_SUCCESS);
            navigate('/auth');
        },
        onError: (error) => {
            toast.error(error.message || AUTH_MESSAGES.PASSWORD_RESET_FAILED);
        }
    });
};

/**
 * Verify Email Mutation
 */
export const useVerifyEmail = () => {
    return useMutation<void, ApiError, string>({
        mutationFn: authService.verifyEmail,
        // Success/Error handling done in component for Verification Page UI states
    });
};

/**
 * Update Profile Mutation
 */
interface UpdateProfileResponse {
    user: User;
}

export const useUpdateProfile = () => {
    const updateUser = useAuthStore((state) => state.updateUser);

    return useMutation<UpdateProfileResponse, ApiError, UserProfileData>({
        mutationFn: authService.updateProfile,
        onSuccess: (data) => {
            updateUser(data.user);
            toast.success(AUTH_MESSAGES.PROFILE_UPDATED);
        },
        onError: (error) => {
            toast.error(error.message || AUTH_MESSAGES.PROFILE_UPDATE_FAILED);
        }
    });
};

/**
 * Change Password Mutation
 */
export const useChangePassword = () => {
    return useMutation<void, ApiError, ChangePasswordData>({
        mutationFn: authService.changePassword,
        onSuccess: () => {
            toast.success(AUTH_MESSAGES.PASSWORD_CHANGE_SUCCESS);
        },
        onError: (error) => {
            toast.error(error.message || AUTH_MESSAGES.PASSWORD_CHANGE_FAILED);
        }
    });
};

/**
 * Update Preferences Mutation
 */
interface UpdatePreferencesResponse {
    user: User;
}

export const useUpdatePreferences = () => {
    const updateUser = useAuthStore((state) => state.updateUser);

    return useMutation<UpdatePreferencesResponse, ApiError, Partial<User["preferences"]>>({
        mutationFn: authService.updatePreferences,
        onSuccess: (data) => {
            updateUser(data.user);
            toast.success(AUTH_MESSAGES.PREFERENCES_UPDATED);
        },
        onError: (error) => {
            toast.error(error.message || AUTH_MESSAGES.PREFERENCES_UPDATE_FAILED);
        }
    });
};
