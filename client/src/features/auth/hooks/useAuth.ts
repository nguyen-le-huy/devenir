import { useAuthStore } from '@/core/stores/useAuthStore';
import { User } from '../types';

/**
 * useAuth Hook
 * Atomic selectors to avoid unnecessary re-renders
 */
export const useAuth = () => {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const loading = useAuthStore((state) => state.loading);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);
    const isAdmin = useAuthStore((state) => state.isAdmin);

    return {
        user: user as User | null, // Cast to feature-specific User type if needed or ensure Store uses it
        isAuthenticated,
        loading,
        login,
        logout,
        isAdmin: isAdmin(),
    };
};
