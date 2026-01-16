/**
 * Permissions API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface Permission {
  id: string;
  code: string;
  description: string | null;
  resource: string | null;
  action: string | null;
  created_at: string;
}

// Admin: List all permissions
export const getPermissions = createServerFn({ method: "POST" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Permission[]>>(
      "/admin/permissions",
      {},
      token
    );
  });
