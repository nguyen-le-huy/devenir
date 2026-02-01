import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { AuthResponse, PhoneVerificationData } from '../types';
import { ApiError } from '@/shared/types';
import { AUTH_MESSAGES } from '../constants';

export const useAddPhone = () => {
    const navigate = useNavigate();
    const loginToStore = useAuthStore((state) => state.login);

    return useMutation<AuthResponse, ApiError, PhoneVerificationData>({
        mutationFn: authService.addPhone,
        onSuccess: (data) => {
            loginToStore(data.token, data.user);
            toast.success(AUTH_MESSAGES.PHONE_VERIFIED);
            navigate('/');
        },
        onError: (error) => {
            toast.error(error.message || AUTH_MESSAGES.PHONE_VERIFICATION_FAILED);
        }
    });
};
