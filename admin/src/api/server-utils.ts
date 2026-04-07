/**
 * Server-side API utilities
 * - getAuthToken: reads access_token from HttpOnly cookie (throws if missing)
 * - authenticatedRequest: wraps apiRequest with automatic 401 → refresh → retry
 */
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { API_URL, ApiError, apiRequest } from "./client";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function getAuthToken(): string {
  const token = getCookie("access_token");
  if (!token) throw new Error("Not authenticated");
  return token;
}

async function refreshServerToken(): Promise<string | null> {
  const refreshTok = getCookie("refresh_token");
  if (!refreshTok) return null;
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshTok }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.success && data.data?.access_token) {
      setCookie("access_token", data.data.access_token, { ...COOKIE_OPTS, maxAge: 60 * 60 });
      if (data.data.refresh_token) {
        setCookie("refresh_token", data.data.refresh_token, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 });
      }
      return data.data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function authenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  try {
    return await apiRequest<T>(endpoint, options, token);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      const newToken = await refreshServerToken();
      if (newToken) {
        return apiRequest<T>(endpoint, options, newToken);
      }
      throw new Error("Session expired. Please login again.");
    }
    throw error;
  }
}
