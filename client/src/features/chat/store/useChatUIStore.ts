/**
 * Chat UI Store
 * Zustand store for client-side UI state only
 * NOT for server data (use React Query for that)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatUIState } from '../types/store.types';

/**
 * Chat UI Store
 * Manages chat window state, minimization, and unread count
 */
export const useChatUIStore = create<ChatUIState>()(
    devtools(
        (set) => ({
            // State
            isOpen: false,
            isMinimized: false,
            unreadCount: 0,

            // Actions
            setOpen: (open: boolean) =>
                set((state) => ({
                    isOpen: open,
                    // Reset unread count when opening
                    unreadCount: open ? 0 : state.unreadCount,
                })),

            toggleMinimize: () =>
                set((state) => ({
                    isMinimized: !state.isMinimized,
                })),

            incrementUnread: () =>
                set((state) => ({
                    unreadCount: state.unreadCount + 1,
                })),

            resetUnread: () =>
                set({
                    unreadCount: 0,
                }),
        }),
        { name: 'ChatUIStore' }
    )
);

/**
 * Atomic selectors for optimal performance
 * Use these instead of accessing the whole store
 */
export const useChatIsOpen = () => useChatUIStore((state) => state.isOpen);
export const useChatIsMinimized = () => useChatUIStore((state) => state.isMinimized);
export const useChatUnreadCount = () => useChatUIStore((state) => state.unreadCount);

/**
 * Action selectors
 */
export const useChatActions = () =>
    useChatUIStore((state) => ({
        setOpen: state.setOpen,
        toggleMinimize: state.toggleMinimize,
        incrementUnread: state.incrementUnread,
        resetUnread: state.resetUnread,
    }));
