/**
 * Authentication API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
}

export const loginAdmin = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { email: string; password: string } }) => {
    return apiRequest<ApiResponse<LoginResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: data.email, password: data.password }),
    });
  });

export const getMe = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<UserProfile>>("/auth/me", {}, data.token);
  });

export const logout = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<null>>("/auth/logout", {
      method: "POST",
    }, data.token);
  });

export const refreshToken = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { refresh_token: string } }) => {
    return apiRequest<ApiResponse<{
      access_token: string;
      refresh_token: string;
    }>>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: data.refresh_token }),
    });
  });
