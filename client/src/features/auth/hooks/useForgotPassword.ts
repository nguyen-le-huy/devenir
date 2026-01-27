import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import authService from '../api/authService';

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (data: { email: string }) => authService.forgotPassword(data),
        onSuccess: () => {
            toast.success('Password reset email has been sent!');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to send reset email');
        }
    });
};
