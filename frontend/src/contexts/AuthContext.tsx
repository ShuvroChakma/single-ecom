/**
 * Authentication Context Provider
 * Path: src/contexts/AuthContext.tsx
 * Following admin structure pattern
 */
import React, { createContext, useEffect, useState } from 'react'

import type { UserProfile } from '@/api/auth'
import * as authApi from '@/api/auth'

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile
  const fetchUser = async () => {
    if (!authApi.isAuthenticated()) {
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.getMe()
      if (response.success) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // Token might be invalid, clear it
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.loginCustomer(email, password)
    if (response.success) {
      await fetchUser()
    } else {
      throw new Error(response.message || 'Login failed')
    }
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  const refetchUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}