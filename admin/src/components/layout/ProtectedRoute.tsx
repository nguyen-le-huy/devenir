import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('admin_token');
  const location = useLocation();
  
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
}
