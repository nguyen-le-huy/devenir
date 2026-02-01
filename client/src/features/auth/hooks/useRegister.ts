import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import authService from '../api/authService';
import { AuthResponse, RegisterData } from '../types';
import { ApiError } from '@/shared/types';
import { AUTH_MESSAGES } from '../constants';

export const useRegister = () => {
    return useMutation<AuthResponse, ApiError, RegisterData>({
        mutationFn: authService.register,
        onError: (error) => {
            toast.error(error.message || AUTH_MESSAGES.REGISTER_FAILED);
        }
    });
};
