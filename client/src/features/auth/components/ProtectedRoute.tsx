import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/useAuthStore';
import Loading from '@/shared/components/Loading/Loading';
import { ReactNode, useState, useEffect } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * Minimum loading duration to prevent visual flicker
 * Fast auth checks (<300ms) will show loading for full duration
 */
const MIN_LOADING_DURATION = 300;

/**
 * ProtectedRoute - Route protection dựa trên authentication
 * Redirect đến /auth nếu chưa đăng nhập
 * 
 * Features:
 * - Minimum 300ms loading to prevent flicker
 * - Atomic Zustand selectors for performance
 * - Replace navigation to avoid back button issues
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    // Atomic selectors - only re-render when these specific values change
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const loading = useAuthStore((state) => state.loading);
    
    // Prevent loading flicker for fast auth checks
    const [showLoading, setShowLoading] = useState(true);
    
    useEffect(() => {
        if (!loading) {
            // Delay hiding loading screen to prevent flicker
            const timer = setTimeout(() => {
                setShowLoading(false);
            }, MIN_LOADING_DURATION);
            
            return () => clearTimeout(timer);
        } else {
            setShowLoading(true);
        }
    }, [loading]);

    if (loading || showLoading) {
        return <Loading size="md" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

/**
 * AdminRoute - Route protection cho admin
 * Redirect đến home nếu không phải admin
 * 
 * Features:
 * - Minimum 300ms loading to prevent flicker
 * - Atomic Zustand selectors for performance
 * - Double-check: authentication + admin role
 */
export const AdminRoute = ({ children }: ProtectedRouteProps) => {
    // Atomic selectors
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const loading = useAuthStore((state) => state.loading);
    const isAdmin = useAuthStore((state) => state.isAdmin);
    
    // Prevent loading flicker for fast auth checks
    const [showLoading, setShowLoading] = useState(true);
    
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                setShowLoading(false);
            }, MIN_LOADING_DURATION);
            
            return () => clearTimeout(timer);
        } else {
            setShowLoading(true);
        }
    }, [loading]);

    if (loading || showLoading) {
        return <Loading size="md" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (!isAdmin()) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
