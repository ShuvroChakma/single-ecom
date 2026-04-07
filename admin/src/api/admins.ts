/**
 * Admins API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

export interface Admin {
  id: string;
  user_id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
  is_super_admin: boolean;
  role_id: string | null;
  role_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPayload {
  email: string;
  password: string;
  username: string;
  role_id?: string;
}

export interface AdminUpdatePayload {
  email?: string;
  username?: string;
  password?: string;
  is_active?: boolean;
  role_id?: string;
}

export interface PaginatedAdmins {
  items: Array<Admin>;
  total: number;
  page: number;
  per_page: number;
}

export interface AdminListParams {
  skip?: number;
  limit?: number;
  q?: string;
  sort?: string;
  order?: string;
  username?: string;
  email?: string;
  is_active?: boolean;
}

// Admin: List admins with pagination
export const getAdmins = createServerFn({ method: "GET" })
  .inputValidator((data: AdminListParams) => data)
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data.skip !== undefined) params.append("skip", data.skip.toString());
    if (data.limit !== undefined) params.append("limit", data.limit.toString());
    if (data.q) params.append("q", data.q);
    if (data.sort) params.append("sort", data.sort);
    if (data.order) params.append("order", data.order);
    if (data.username) params.append("username", data.username);
    if (data.email) params.append("email", data.email);
    if (data.is_active !== undefined) params.append("is_active", data.is_active.toString());

    return authenticatedRequest<ApiResponse<PaginatedAdmins>>(
      `/admin/admins?${params.toString()}`
    );
  });

// Admin: Get single admin
export const getAdmin = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Admin>>(
      `/admin/admins/${data.id}`
    );
  });

// Admin: Create admin
export const createAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: AdminPayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Admin>>(
      "/admin/admins",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update admin
export const updateAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { admin: AdminUpdatePayload; id: string }) => data)
  .handler(async ({ data }) => {
    const { id, admin } = data;

    return authenticatedRequest<ApiResponse<Admin>>(
      `/admin/admins/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(admin),
      }
    );
  });

// Admin: Delete admin
export const deleteAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<null>>(
      `/admin/admins/${data.id}`,
      { method: "DELETE" }
    );
  });
