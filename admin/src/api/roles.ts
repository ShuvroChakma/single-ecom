/**
 * Roles API Server Functions
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

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Array<Permission>;
}

export interface RoleListItem {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedRoles {
  items: Array<RoleListItem>;
  total: number;
  page: number;
  per_page: number;
}

export interface RolePayload {
  name: string;
  description?: string;
  permission_ids?: Array<string>;
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  permission_ids?: Array<string>;
}

// Admin: List roles with pagination
export const getRoles = createServerFn({ method: "GET" })
  .inputValidator((data?: { page?: number; per_page?: number; q?: string }) => data)
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data?.page) params.append("page", data.page.toString());
    if (data?.per_page) params.append("per_page", data.per_page.toString());
    if (data?.q) params.append("q", data.q);

    return authenticatedRequest<ApiResponse<PaginatedRoles>>(
      `/admin/roles?${params.toString()}`
    );
  });

// Admin: Get single role with permissions
export const getRole = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<RoleWithPermissions>>(
      `/admin/roles/${data.id}`
    );
  });

// Admin: Create role
export const createRole = createServerFn({ method: "POST" })
  .inputValidator((data: RolePayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Role>>(
      "/admin/roles",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update role
export const updateRole = createServerFn({ method: "POST" })
  .inputValidator((data: { role: RoleUpdatePayload; id: string }) => data)
  .handler(async ({ data }) => {
    const { id, role } = data;

    return authenticatedRequest<ApiResponse<null>>(
      `/admin/roles/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(role),
      }
    );
  });

// Admin: Delete role
export const deleteRole = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<null>>(
      `/admin/roles/${data.id}`,
      { method: "DELETE" }
    );
  });
