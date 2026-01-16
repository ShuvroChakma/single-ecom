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
    if (response.success && response.data.refresh_token && response.data.access_token) {
      setCookie("refresh_token", response.data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });

      // Store access token in cookie for Server Functions
      setCookie("access_token", response.data.access_token, {
        httpOnly: true, // Secure it as well
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour (or match backend expiry)
        path: "/",
      });
    }

    return response;
  });

export const getMe = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { token?: string } }) => {
    // Try to get token from cookie if not provided
    const token = data?.token || getCookie("access_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return apiRequest<ApiResponse<UserProfile>>("/auth/me", {}, token);
  });

export const logout = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data?: { token?: string } }) => {
    // Clear cookies
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/",
    };

    setCookie("refresh_token", "", options);
    setCookie("access_token", "", options);

    // Get token for request
    const token = data?.token || getCookie("access_token");

    if (token) {
      return apiRequest<ApiResponse<null>>("/auth/logout", {
        method: "POST",
        }, token);
    }

    return { success: true, message: "Logged out", data: null };
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

      // Update cookies with new tokens
      if (response.success && response.data.refresh_token && response.data.access_token) {
        setCookie("refresh_token", response.data.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: "/",
        });

        setCookie("access_token", response.data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
          path: "/",
        });
      }

      return response;
    } catch {
      // Clear invalid tokens
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 0,
        path: "/",
      };

      setCookie("refresh_token", "", options);
      setCookie("access_token", "", options);

      return {
        success: false,
        message: "Failed to refresh token",
        data: null,
      };
    }
  });
