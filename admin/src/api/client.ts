/**
 * API Client Base Utilities with Token Refresh Support
 */

// Base API configuration
export const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Backend error response format
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
      field: string | null;
  };
    errors?: Array<{
        code: string;
        message: string;
        field: string | null;
    }>;
    details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Token refresh callback type
type TokenRefreshCallback = () => Promise<{
    access_token: string;
    refresh_token: string;
} | null>;

// Store refresh callback (set from auth module)
let tokenRefreshCallback: TokenRefreshCallback | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Set the token refresh callback function
 */
export function setTokenRefreshCallback(callback: TokenRefreshCallback) {
    tokenRefreshCallback = callback;
}

/**
 * Refresh token and return new access token
 */
async function refreshToken(): Promise<string | null> {
    // If already refreshing, wait for that to complete
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    if (!tokenRefreshCallback) {
        return null;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const result = await tokenRefreshCallback!();
            if (result) {
                return result.access_token;
            }
            return null;
        } catch {
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * Extract detailed error message from API error response
 */
function extractErrorMessage(errorData: ApiErrorResponse): string {
    // Check for validation errors array (most detailed)
    if (errorData.errors && errorData.errors.length > 0) {
        const messages = errorData.errors.map((err) => {
            if (err.field) {
                return `${err.field}: ${err.message}`;
            }
            return err.message;
        });
        return messages.join(". ");
    }

    // Use main error message
    if (errorData.error?.message) {
        return errorData.error.message;
    }

    return "An error occurred";
}

/**
 * Custom error class for API errors with detailed info
 */
export class ApiError extends Error {
    code: string;
    field: string | null;
    statusCode: number;
    details?: Record<string, any>;
    errors?: Array<{ code: string; message: string; field: string | null }>;

    constructor(
        message: string,
        code: string,
        statusCode: number,
        field: string | null = null,
        details?: Record<string, any>,
        errors?: Array<{ code: string; message: string; field: string | null }>
    ) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.statusCode = statusCode;
        this.field = field;
        this.details = details;
        this.errors = errors;
    }
}

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends ApiError {
    constructor(message: string, code = "AUTH_FAILED") {
        super(message, code, 401);
        this.name = "AuthenticationError";
    }
}

/**
 * Generic server-side API fetch function with automatic token refresh
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
    token?: string,
    retryOnUnauthorized = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
      credentials: "include", // Include cookies for HttpOnly refresh token
  });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryOnUnauthorized && token) {
        const newToken = await refreshToken();

        if (newToken) {
            // Retry request with new token
            return apiRequest<T>(endpoint, options, newToken, false);
        }

        // Refresh failed - throw auth error
        throw new AuthenticationError("Session expired. Please login again.");
    }

  if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json().catch(() => ({
          success: false,
          error: {
              code: "UNKNOWN_ERROR",
              message: response.statusText || `HTTP ${response.status}`,
              field: null,
          },
    }));

      // Extract detailed error message
      const message = extractErrorMessage(errorData);

      throw new ApiError(
          message,
          errorData.error?.code || "UNKNOWN_ERROR",
          response.status,
          errorData.error?.field || null,
          errorData.details,
          errorData.errors
      );
  }

  return response.json();
}
