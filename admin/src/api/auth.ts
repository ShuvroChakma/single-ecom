/**
 * Authentication API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
}

export const loginAdmin = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { email: string; password: string } }) => {
    const response = await apiRequest<ApiResponse<LoginResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: data.email, password: data.password }),
    });

    // Store refresh token in HttpOnly cookie on the TanStack Start server
    if (response.success && response.data.refresh_token) {
      setCookie("refresh_token", response.data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });
    }

    return response;
  });

export const getMe = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<UserProfile>>("/auth/me", {}, data.token);
  });

export const logout = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { token: string } }) => {
    // Clear refresh token cookie
    setCookie("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return apiRequest<ApiResponse<null>>("/auth/logout", {
      method: "POST",
    }, data.token);
  });

export const refreshToken = createServerFn({ method: "POST" })
  .handler(async () => {
    // Get refresh token from HttpOnly cookie
    const storedRefreshToken = getCookie("refresh_token");

    if (!storedRefreshToken) {
      return {
        success: false,
        message: "No refresh token found",
        data: null,
      };
    }

    try {
      const response = await apiRequest<ApiResponse<{
        access_token: string;
        refresh_token: string;
      }>>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      // Update refresh token cookie with new token
      if (response.success && response.data.refresh_token) {
        setCookie("refresh_token", response.data.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: "/",
        });
      }

      return response;
    } catch {
      // Clear invalid token
      setCookie("refresh_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });

      return {
        success: false,
        message: "Failed to refresh token",
        data: null,
      };
    }
  });
