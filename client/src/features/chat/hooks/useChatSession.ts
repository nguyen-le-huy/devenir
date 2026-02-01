/**
 * Chat Session Hook
 * Manages guest and authenticated user sessions
 * Handles sessionId persistence in localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { GUEST_SESSION_KEY } from '../utils/chatConstants';

interface UseChatSessionReturn {
    sessionId: string | null;
    isAuthenticated: boolean;
    setSessionId: (id: string) => void;
    clearSession: () => void;
}

/**
 * Hook for managing chat session state
 * Handles both guest and authenticated sessions
 */
export const useChatSession = (): UseChatSessionReturn => {
    // Get auth state with atomic selector
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Guest session ID (only for non-authenticated users)
    const [sessionId, setSessionIdState] = useState<string | null>(() => {
        if (isAuthenticated) return null;
        return localStorage.getItem(GUEST_SESSION_KEY);
    });

    // Update session ID and persist to localStorage
    const setSessionId = useCallback((id: string) => {
        if (!isAuthenticated) {
            setSessionIdState(id);
            localStorage.setItem(GUEST_SESSION_KEY, id);
        }
    }, [isAuthenticated]);

    // Clear session
    const clearSession = useCallback(() => {
        setSessionIdState(null);
        localStorage.removeItem(GUEST_SESSION_KEY);
    }, []);

    // Clear guest session when user logs in
    useEffect(() => {
        if (isAuthenticated) {
            clearSession();
        }
    }, [isAuthenticated, clearSession]);

    return {
        sessionId,
        isAuthenticated,
        setSessionId,
        clearSession,
    };
};
