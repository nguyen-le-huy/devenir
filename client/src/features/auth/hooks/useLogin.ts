import { useMutation } from '@tanstack/react-query';
import authService from '../api/authService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { LoginData } from '../types';
import { ApiError } from '@/shared/types';

export const useLogin = () => {
    const loginToStore = useAuthStore((state) => state.login);

    return useMutation<
        Awaited<ReturnType<typeof authService.login>>,
        ApiError,
        LoginData
    >({
        mutationFn: (data: LoginData) => authService.login(data),
        onSuccess: (data) => {
            loginToStore(data.token, data.user);
        },
    });
};

