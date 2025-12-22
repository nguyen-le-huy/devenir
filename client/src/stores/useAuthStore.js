import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

/**
 * useAuthStore - Zustand store for authentication state
 * Replaces AuthContext for better performance via atomic selectors
 */
export const useAuthStore = create(
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
                set({ user: { ...currentUser, ...updatedData } });
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
            }),
            onRehydrateStorage: () => (state) => {
                // After rehydration, set loading to false
                if (state) {
                    state.setLoading(false);
                }
            },
        }
    )
);
