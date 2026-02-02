/**
 * Query Keys for Chat Feature
 * Centralized keys for React Query caching
 */
export const chatKeys = {
    all: ['chat'] as const,
    history: () => [...chatKeys.all, 'history'] as const,
    session: (sessionId: string) => [...chatKeys.all, 'session', sessionId] as const,
};
