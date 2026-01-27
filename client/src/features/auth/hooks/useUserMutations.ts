import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import { ResetPasswordData } from '../types';
import { useAuthStore } from '@/core/stores/useAuthStore';

export const useResetPassword = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: ({ token, data }: { token: string; data: ResetPasswordData }) =>
            authService.resetPassword(token, data),
        onSuccess: () => {
            toast.success('Password reset successful! Please login.');
            navigate('/auth');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to reset password');
        }
    });
};

export const useVerifyEmail = () => {
    return useMutation({
        mutationFn: (token: string) => authService.verifyEmail(token),
        // Success/Error handling usually done in the component for Verification Page to show UI states
    });
};

export const useUpdateProfile = () => {
    const updateUser = useAuthStore((state) => state.updateUser);

    return useMutation({
        mutationFn: authService.updateProfile,
        onSuccess: (data) => {
            updateUser(data.user);
            toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update profile');
        }
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: authService.changePassword,
        onSuccess: () => {
            toast.success('Password changed successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to change password');
        }
    });
};

export const useUpdatePreferences = () => {
    const updateUser = useAuthStore((state) => state.updateUser);

    return useMutation({
        mutationFn: authService.updatePreferences,
        onSuccess: (data) => {
            updateUser(data.user);
            toast.success('Preferences updated');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update preferences');
        }
    });
};
