import { useMutation } from '@tanstack/react-query';
import authService from '../api/authService';

export const useGoogleAuth = () => {
    return useMutation({
        mutationFn: (credential: string) => authService.googleLogin(credential),
    });
};
