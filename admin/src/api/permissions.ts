/**
 * Permissions API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

export interface Permission {
  id: string;
  code: string;
  description: string | null;
  resource: string | null;
  action: string | null;
  created_at: string;
}

// Admin: List all permissions
export const getPermissions = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<Permission>>>("/admin/permissions");
  });
