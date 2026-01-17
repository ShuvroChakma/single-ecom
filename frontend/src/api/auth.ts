/**
 * Authentication API Functions
 * Path: src/api/auth.ts
 * Following admin structure pattern
 */
import api from './client'
import type { ApiResponse } from './client'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RegisterPayload {
  title: string
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
}

export interface RegisterResponse {
  id: string
  email: string
  message: string
}

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  title: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

// Register new customer
export const register = async (data: RegisterPayload) => {
  const response = await api.post<ApiResponse<RegisterResponse>>(
    '/api/v1/auth/register',
    data
  )
  return response.data
}

// Login customer
export const loginCustomer = async (email: string, password: string) => {
  const response = await api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', {
    username: email,
    password,
  })

  if (response.data.success) {
    const { access_token, refresh_token } = response.data.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
  }

  return response.data
}

// Get current user profile
export const getMe = async () => {
  const response = await api.get<ApiResponse<UserProfile>>('/api/v1/auth/me')
  return response.data
}

// Logout customer
export const logout = async () => {
  try {
    await api.post<ApiResponse<null>>('/api/v1/auth/logout')
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

// Verify email with OTP
export const verifyEmail = async (email: string, otp: string) => {
  const response = await api.post<ApiResponse<{ message: string }>>(
    '/api/v1/auth/verify-email',
    { email, otp }
  )
  return response.data
}

// Resend OTP
export const resendOTP = async (email: string) => {
  const response = await api.post<ApiResponse<{ message: string }>>(
    '/api/v1/auth/resend-otp',
    { email }
  )
  return response.data
}

// Change password (when logged in)
export const changePassword = async (data: ChangePasswordPayload) => {
  const response = await api.post<ApiResponse<{ message: string }>>(
    '/api/v1/auth/change-password',
    data
  )
  return response.data
}

// Refresh access token
export const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token')
  if (!refresh_token) {
    throw new Error('No refresh token available')
  }

  const response = await api.post<ApiResponse<LoginResponse>>('/api/v1/auth/refresh', {
    refresh_token,
  })

  if (response.data.success) {
    const { access_token, refresh_token: new_refresh_token } = response.data.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', new_refresh_token)
  }

  return response.data
}

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token')
}