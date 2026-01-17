/**
 * Authentication Context Provider
 * Uses server functions for security (tokens in HttpOnly cookies)
 */
import React, { createContext, useEffect, useState, useCallback } from 'react'

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

  // Fetch user profile using server function
  const fetchUser = useCallback(async () => {
    try {
      const response = await authApi.getMe()
      if (response.success && response.data) {
        // Reject admin users - this is customer frontend only
        if (response.data.user_type === 'ADMIN') {
          await authApi.logout()
          setUser(null)
        } else {
          setUser(response.data)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check auth status on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const response = await authApi.loginCustomer({ data: { email, password } })
    if (response.success) {
      // Fetch user profile to check user type
      const userResponse = await authApi.getMe()

      if (userResponse.success && userResponse.data) {
        // Reject admin users - this is customer frontend only
        if (userResponse.data.user_type === 'ADMIN') {
          // Logout immediately to clear tokens
          await authApi.logout()
          throw new Error('Admin users cannot login here. Please use the admin panel.')
        }
        setUser(userResponse.data)
      } else {
        throw new Error('Failed to fetch user profile')
      }
    } else {
      throw new Error(response.message || 'Login failed')
    }
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  const refetchUser = async () => {
    setIsLoading(true)
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
