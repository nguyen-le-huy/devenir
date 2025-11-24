import * as React from 'react'

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  phone?: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  token: string | null
  setUser: (user: AdminUser | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const AdminAuthContext = React.createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage immediately (synchronously)
  const getInitialState = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        return {
          token: storedToken,
          user: JSON.parse(storedUser)
        }
      } catch (error) {
        console.error('Error loading admin auth:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    return { token: null, user: null }
  }

  const initialState = getInitialState()
  const [user, setUser] = React.useState<AdminUser | null>(initialState.user)
  const [token, setToken] = React.useState<string | null>(initialState.token)

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value: AdminAuthContextType = {
    user,
    token,
    setUser,
    setToken,
    logout,
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
