/**
 * Store-specific types for Chat feature
 * Defines Zustand store interfaces
 */

/**
 * Chat UI state managed by Zustand
 * Only for client-side UI state, NOT server data
 */
export interface ChatUIState {
    isOpen: boolean;
    isMinimized: boolean;
    unreadCount: number;

    // Actions
    setOpen: (open: boolean) => void;
    toggleMinimize: () => void;
    incrementUnread: () => void;
    resetUnread: () => void;
}

/**
 * Chat session state
 */
export interface ChatSessionState {
    sessionId: string | null;
    guestId: string | null;
    isGuest: boolean;

    // Actions
    setSessionId: (sessionId: string) => void;
    setGuestId: (guestId: string) => void;
    clearSession: () => void;
}
