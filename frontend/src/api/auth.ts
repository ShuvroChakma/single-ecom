/**
 * Authentication API Server Functions
 * Uses server functions for security (tokens in HttpOnly cookies)
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";
import { z } from "zod";

const registerSchema = z.object({
  title: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4, "OTP is required"),
});

const resendOTPSchema = z.object({
  email: z.string().email(),
  type: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]).optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone_number: z.string().optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

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
  first_name: string;
  last_name: string;
  phone_number: string | null;
  user_type: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
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
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
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
  .inputValidator((data: unknown) => verifyEmailSchema.parse(data))
  .handler(async ({ data }) => {
    return apiRequest<ApiResponse<{ message: string }>>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

// Resend OTP
export const resendOTP = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resendOTPSchema.parse(data))
  .handler(async ({ data }) => {
    return apiRequest<ApiResponse<{ message: string }>>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        type: data.type || 'EMAIL_VERIFICATION',
      }),
    });
  });

// Reset password with OTP (forgot password flow)
export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resetPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    return apiRequest<ApiResponse<{ message: string }>>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

// Update user profile
export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");
    return apiRequest<ApiResponse<null>>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }, token);
  });

// Change password (when logged in)
export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => changePasswordSchema.parse(data))
  .handler(async ({ data }) => {
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
