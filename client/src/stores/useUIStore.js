import { create } from 'zustand';

/**
 * useUIStore - Zustand store for UI state
 * Manages theme, modals, sidebar visibility, etc.
 */
export const useUIStore = create((set) => ({
    // State
    theme: 'light',
    isSidebarOpen: false,
    activeModal: null,

    // Actions
    setTheme: (theme) => set({ theme }),
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
    })),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    openModal: (modalName) => set({ activeModal: modalName }),
    closeModal: () => set({ activeModal: null }),
}));
