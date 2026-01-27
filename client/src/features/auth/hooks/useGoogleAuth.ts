import { useMutation } from '@tanstack/react-query';
import authService from '../api/authService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { ApiError } from '@/shared/types';

export const useGoogleAuth = () => {
    const loginToStore = useAuthStore((state) => state.login);

    return useMutation<
        Awaited<ReturnType<typeof authService.googleLogin>>,
        ApiError,
        string
    >({
        mutationFn: (credential: string) => authService.googleLogin(credential),
        onSuccess: (data) => {
            loginToStore(data.token, data.user);
        },
    });
};
