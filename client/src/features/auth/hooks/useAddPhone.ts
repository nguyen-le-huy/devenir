import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { PhoneVerificationData } from '../types';

export const useAddPhone = () => {
    const navigate = useNavigate();
    const loginToStore = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: (data: PhoneVerificationData) => authService.addPhone(data),
        onSuccess: (data) => {
            loginToStore(data.token, data.user);
            toast.success('Phone verified successfully');
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Phone verification failed');
        }
    });
};
