import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAdminAuth()

  // If token exists, render children
  // If token is null after context load, redirect to login
  if (token === null) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
