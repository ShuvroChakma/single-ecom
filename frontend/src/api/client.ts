/**
 * API Client Base Utilities with Token Refresh Support
 * Uses server-side fetch for security (tokens in HttpOnly cookies)
 */

// API_BASE is server-only — uses process.env (no VITE_ prefix, never in browser bundle)
export const API_BASE = process.env.API_URL || "http://localhost:8000/api/v1";

// VITE_MEDIA_URL must use import.meta.env so Vite injects it on both client and SSR
export const SERVER_URL = import.meta.env.VITE_MEDIA_URL || "";

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
  items: Array<T>;
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
            const result = await tokenRefreshCallback();
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
    if (errorData.error.message) {
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
 * Helper to extract error message from any error type
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "An unknown error occurred";
}

/**
 * Extract field-specific errors from API error
 * Returns a map of field name to error message
 */
export const getFieldErrors = (error: unknown): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};

    if (error instanceof ApiError) {
        // Check for multiple errors array
        if (error.errors && error.errors.length > 0) {
            for (const err of error.errors) {
                if (err.field) {
                    fieldErrors[err.field] = err.message;
                }
            }
        }
        // Check for single field error
        else if (error.field) {
            fieldErrors[error.field] = error.message;
        }
    }

    return fieldErrors;
}

/**
 * Check if error has field-specific errors
 */
export const hasFieldErrors = (error: unknown): boolean => {
    if (error instanceof ApiError) {
        if (error.errors && error.errors.some(e => e.field)) {
            return true;
        }
        if (error.field) {
            return true;
        }
    }
    return false;
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
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE}${endpoint}`;
  const method = options.method || 'GET';

  // Log full request
  console.log(`\n[API REQUEST] ${method} ${fullUrl}`);
  console.log('[API REQUEST] Headers:', JSON.stringify(headers, null, 2));
  if (options.body) {
    console.log('[API REQUEST] Body:', options.body);
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include", // Include cookies for HttpOnly refresh token
    });
  } catch (err) {
    console.error(`[API] Network error: ${method} ${fullUrl}`, err);
    throw err;
  }

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryOnUnauthorized && token) {
        const newToken = await refreshToken();

        if (newToken) {
            // Retry request with new token
            return apiRequest<T>(endpoint, options, newToken, false);
        }

        // Refresh failed - throw auth error
        console.error(`[API] 401 Unauthorized (token refresh failed): ${options.method || 'GET'} ${fullUrl}`);
        throw new AuthenticationError("Session expired. Please login again.");
    }

  // Log response status
  console.log(`[API RESPONSE] ${response.status} ${response.statusText} ← ${method} ${fullUrl}`);

  if (!response.ok) {
      const rawText = await response.text().catch(() => '');
      let errorData: ApiErrorResponse;
      try {
        errorData = JSON.parse(rawText);
      } catch {
        errorData = {
          success: false,
          error: {
            code: "UNKNOWN_ERROR",
            message: response.statusText || `HTTP ${response.status}`,
            field: null,
          },
        };
      }

      // Extract detailed error message
      const message = extractErrorMessage(errorData);

      console.error(
        `\n[API ERROR] ${response.status} ${method} ${fullUrl}`,
        '\n  message:', message,
        '\n  code:', errorData.error.code,
        '\n  raw response:', rawText,
        errorData.errors?.length ? '\n  errors:' : '',
        errorData.errors?.length ? errorData.errors : ''
      );

      throw new ApiError(
          message,
          errorData.error.code || "UNKNOWN_ERROR",
          response.status,
          errorData.error.field || null,
          errorData.details,
          errorData.errors
      );
  }

  return response.json();
}

/**
 * Helper function to get full image URL
 * Prepends the backend server URL to relative paths.
 * @param url - The image URL or path
 * @param placeholder - Placeholder to return for null/empty values (default: empty string)
 */
export function getImageUrl(url: string | null | undefined, placeholder: string = ''): string {
  if (!url) return placeholder
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Prepend backend URL for relative paths
  return `${SERVER_URL}${url}`
}
