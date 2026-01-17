/**
 * API Client Base Utilities (Enhanced for Client-Side)
 * Path: src/api/client.ts
 */
import axios from 'axios'
import type { AxiosError } from 'axios';


// Base API configuration
export const API_URL =
  import.meta.env.VITE_API_URL || 'https://dev-api.nazumeahjewellers.com/api'

// API Response types
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// Backend error response format
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    field: string | null
  }
  errors?: Array<{
    code: string
    message: string
    field: string | null
  }>
  details?: Record<string, any>
}

export interface PaginatedResponse<T> {
  items: Array<T>
  total: number
  page: number
  limit: number
  pages: number
}

/**
 * Custom error class for API errors with detailed info
 */
export class ApiError extends Error {
  code: string
  field: string | null
  statusCode: number
  details?: Record<string, any>
  errors?: Array<{ code: string; message: string; field: string | null }>

  constructor(
    message: string,
    code: string,
    statusCode: number,
    field: string | null = null,
    details?: Record<string, any>,
    errors?: Array<{ code: string; message: string; field: string | null }>
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.field = field
    this.details = details
    this.errors = errors
  }
}

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends ApiError {
  constructor(message: string, code = 'AUTH_FAILED') {
    super(message, code, 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Extract detailed error message from API error response
 */
function extractErrorMessage(errorData: ApiErrorResponse): string {
  // Check for validation errors array (most detailed)
  if (errorData.errors && errorData.errors.length > 0) {
    const messages = errorData.errors.map((err) => {
      if (err.field) {
        return `${err.field}: ${err.message}`
      }
      return err.message
    })
    return messages.join('. ')
  }

  // Use main error message
  if (errorData.error?.message) {
    return errorData.error.message
  }

  return 'An error occurred'
}

/**
 * Helper to extract error message from any error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse

    // Check for validation errors array
    if (apiError?.errors && apiError.errors.length > 0) {
      return apiError.errors
        .map((err) => (err.field ? `${err.field}: ${err.message}` : err.message))
        .join('. ')
    }

    // Use main error message
    if (apiError?.error?.message) {
      return apiError.error.message
    }

    return error.message || 'An error occurred'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unknown error occurred'
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies
})

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

/**
 * Refresh token and return new access token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    return null
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await axios.post<ApiResponse<{
        access_token: string
        refresh_token: string
      }>>(
        `${API_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      )

      if (response.data.success) {
        const { access_token, refresh_token: new_refresh_token } = response.data.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', new_refresh_token)
        return access_token
      }

      return null
    } catch (error) {
      // Refresh failed, clear tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as any

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const newToken = await refreshAccessToken()

      if (newToken) {
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }

      // Refresh failed - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/profile'
      }
    }

    // Transform error to ApiError
    if (error.response?.data) {
      const errorData = error.response.data
      const message = extractErrorMessage(errorData)

      throw new ApiError(
        message,
        errorData.error?.code || 'UNKNOWN_ERROR',
        error.response.status,
        errorData.error?.field || null,
        errorData.details,
        errorData.errors
      )
    }

    return Promise.reject(error)
  }
)

export default api