import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '@/features/auth/api/authService';

// Define types for User and AuthState
// Start with basic types, refine later as we migrate User feature
export interface User {
    _id: string;
    email: string;
    role: 'user' | 'admin';
    name?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthday?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => Promise<void>;
    updateUser: (updatedData: Partial<User>) => void;
    isAdmin: () => boolean;
    setLoading: (loading: boolean) => void;
    initAuth: () => void;
}

/**
 * useAuthStore - Zustand store for authentication state
 * Replaces AuthContext for better performance via atomic selectors
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            loading: true,

            // Actions
            login: (token, user) => {
                set({ token, user, isAuthenticated: true, loading: false });
            },

            logout: async () => {
                try {
                    await authService.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({ token: null, user: null, isAuthenticated: false });
                }
            },

            updateUser: (updatedData) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...updatedData } });
                }
            },

            isAdmin: () => get().user?.role === 'admin',

            setLoading: (loading) => set({ loading }),

            // Called after hydration from localStorage
            initAuth: () => {
                const { token, user } = get();
                if (token && user) {
                    set({ isAuthenticated: true, loading: false });
                } else {
                    set({ loading: false });
                }
            },
        }),
        {
            name: 'devenir-auth', // localStorage key
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }) as any, // Cast to any or Partial<AuthState> to avoid TS complexity with partialize return type
            onRehydrateStorage: () => (state) => {
                // After rehydration, set loading to false
                if (state) {
                    state.setLoading(false);
                }
            },
        }
    )
);
