import { io, Socket } from 'socket.io-client';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3111/api';
// Remove /api suffix for socket setup if needed, depending on server config
const SOCKET_URL: string = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '')).replace(/\/$/, '');

let socketInstance: Socket | null = null;
let currentToken: string | null = null;

export const getSocket = (token: string | null): Socket | null => {
    if (!token) return null;

    if (socketInstance && currentToken === token) {
        return socketInstance;
    }

    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }

    currentToken = token;
    // @ts-ignore - Socket.io types might conflict slightly with client logic or extra options
    socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Allow fallback to polling
        autoConnect: true,
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000, // Increase timeout for slow connections
    });

    // Debug logging for development
    if (import.meta.env.DEV && socketInstance) {
        socketInstance.on('connect', () => {
            console.log('✅ Socket connected:', socketInstance?.id);
        });

        socketInstance.on('connect_error', (error: Error) => {
            console.error('❌ Socket connection error:', error.message);
        });

        socketInstance.on('disconnect', (reason: string) => {
            console.warn('🔌 Socket disconnected:', reason);
        });
    }

    return socketInstance;
};
