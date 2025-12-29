import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import Loading from './Loading/Loading.jsx';

/**
 * ProtectedRoute - Route protection dựa trên authentication
 * Redirect đến /auth nếu chưa đăng nhập
 */
export const ProtectedRoute = ({ children }) => {
  // Atomic selectors - only re-render when these specific values change
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <Loading size="md" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

/**
 * AdminRoute - Route protection cho admin
 * Redirect đến home nếu không phải admin
 */
export const AdminRoute = ({ children }) => {
  // Atomic selectors
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (loading) {
    return <Loading size="md" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};
