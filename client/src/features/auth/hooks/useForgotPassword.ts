import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import authService from '../api/authService';
import { ApiError } from '@/shared/types';
import { AUTH_MESSAGES } from '../constants';

interface ForgotPasswordData {
    email: string;
}

export const useForgotPassword = () => {
    return useMutation<void, ApiError, ForgotPasswordData>({
        mutationFn: authService.forgotPassword,
        onSuccess: () => {
            toast.success(AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT);
        },
        onError: (error) => {
            toast.error(error.message || AUTH_MESSAGES.FORGOT_PASSWORD_FAILED);
        }
    });
};
