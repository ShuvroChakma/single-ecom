/**
 * Roles API Server Functions
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

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
    updated_at: string;
}

export interface RoleWithPermissions extends Role {
    permissions: Permission[];
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
    items: RoleListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface RolePayload {
    name: string;
    description?: string;
    permission_ids?: string[];
}

export interface RoleUpdatePayload {
    name?: string;
    description?: string;
    permission_ids?: string[];
}

// Admin: List roles with pagination
export const getRoles = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data?: { page?: number; per_page?: number; q?: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data?.page) params.append("page", data.page.toString());
    if (data?.per_page) params.append("per_page", data.per_page.toString());
      if (data?.q) params.append("q", data.q);

    return apiRequest<ApiResponse<PaginatedRoles>>(
      `/admin/roles?${params.toString()}`,
      {},
      token
    );
  });

// Admin: Get single role with permissions
export const getRole = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

      return apiRequest<ApiResponse<RoleWithPermissions>>(
          `/admin/roles/${data.id}`,
          {},
          token
      );
  });

// Admin: Create role
export const createRole = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: RolePayload }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Role>>(
        "/admin/roles",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
        token
    );
  });

// Admin: Update role
export const updateRole = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { role: RoleUpdatePayload; id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        const { id, role } = data;

        return apiRequest<ApiResponse<null>>(
            `/admin/roles/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(role),
            },
            token
        );
    });

// Admin: Delete role
export const deleteRole = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<null>>(
      `/admin/roles/${data.id}`,
        { method: "DELETE" },
      token
    );
  });
