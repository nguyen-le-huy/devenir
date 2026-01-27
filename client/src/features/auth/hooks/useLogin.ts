import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { LoginData } from '../types';

export const useLogin = () => {
    const navigate = useNavigate();
    const loginToStore = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: (data: LoginData) => authService.login(data),
        onSuccess: (data) => {
            loginToStore(data.token, data.user);
            toast.success('Welcome back!');
            navigate('/');
        },
        onError: (error: any) => {
            // Error is handled by component if needed, or we just toast here
            const message = error?.message || 'Login failed';
            toast.error(message);
        }
    });
};
