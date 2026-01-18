/**
 * Authentication API Server Functions
 * Uses server functions for security (tokens in HttpOnly cookies)
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  title?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  user_type: string;
  // Customer-specific fields
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  // Admin-specific fields
  role_name?: string;
  permissions?: string[];
  created_at: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

// Cookie options
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge,
  path: "/",
});

// Register new customer
export const register = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: RegisterPayload }) => {
    return apiRequest<ApiResponse<{ message: string }>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone,
      }),
    });
  });

// Login customer
export const loginCustomer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { email: string; password: string } }) => {
    const response = await apiRequest<ApiResponse<LoginResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: data.email, password: data.password }),
    });

    // Store tokens in HttpOnly cookies
    if (response.success && response.data.refresh_token && response.data.access_token) {
      setCookie("refresh_token", response.data.refresh_token, getCookieOptions(7 * 24 * 60 * 60)); // 7 days
      setCookie("access_token", response.data.access_token, getCookieOptions(60 * 60)); // 1 hour
    }

    return response;
  });

// Get current user profile
export const getMe = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) {
      return { success: false, message: "Not authenticated", data: null };
    }
    return apiRequest<ApiResponse<UserProfile>>("/auth/me", {}, token);
  });

// Check if user is authenticated (server-side)
export const checkAuth = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    return { isAuthenticated: !!token };
  });

// Logout customer
export const logout = createServerFn({ method: "POST" })
  .handler(async () => {
    const token = getCookie("access_token");

    // Clear cookies first
    const clearOptions = getCookieOptions(0);
    setCookie("refresh_token", "", clearOptions);
    setCookie("access_token", "", clearOptions);

    // Try to call logout endpoint
    if (token) {
      try {
        await apiRequest<ApiResponse<null>>("/auth/logout", {
          method: "POST",
        }, token);
      } catch {
        // Ignore errors - cookies are already cleared
      }
    }

    return { success: true, message: "Logged out", data: null };
  });

// Verify email with OTP
export const verifyEmail = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { email: string; otp: string } }) => {
    return apiRequest<ApiResponse<{ message: string }>>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

// Resend OTP
export const resendOTP = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { email: string; type?: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' } }) => {
    return apiRequest<ApiResponse<{ message: string }>>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        type: data.type || 'EMAIL_VERIFICATION',
      }),
    });
  });

// Change password (when logged in)
export const changePassword = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: ChangePasswordPayload }) => {
    const token = getCookie("access_token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    return apiRequest<ApiResponse<{ message: string }>>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }, token);
  });

// Refresh access token
export const refreshToken = createServerFn({ method: "POST" })
  .handler(async () => {
    const storedRefreshToken = getCookie("refresh_token");

    if (!storedRefreshToken) {
      return {
        success: false,
        message: "No refresh token found",
        data: null,
      };
    }

    try {
      const response = await apiRequest<ApiResponse<LoginResponse>>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      // Update cookies with new tokens
      if (response.success && response.data.refresh_token && response.data.access_token) {
        setCookie("refresh_token", response.data.refresh_token, getCookieOptions(7 * 24 * 60 * 60));
        setCookie("access_token", response.data.access_token, getCookieOptions(60 * 60));
      }

      return response;
    } catch {
      // Clear invalid tokens
      const clearOptions = getCookieOptions(0);
      setCookie("refresh_token", "", clearOptions);
      setCookie("access_token", "", clearOptions);

      return {
        success: false,
        message: "Failed to refresh token",
        data: null,
      };
    }
  });
