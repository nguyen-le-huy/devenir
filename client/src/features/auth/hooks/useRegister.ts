import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import authService from '../api/authService';
import { RegisterData } from '../types';

export const useRegister = () => {
    return useMutation({
        mutationFn: (data: RegisterData) => authService.register(data),
        onError: (error: any) => {
            const message = error?.message || 'Registration failed';
            toast.error(message);
        }
    });
};
