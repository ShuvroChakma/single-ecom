/**
 * Admins API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface Admin {
  id: string;
  user_id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
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
}

export interface PaginatedAdmins {
  items: Admin[];
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
export const getAdmins = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: AdminListParams }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data.skip !== undefined) params.append("skip", data.skip.toString());
    if (data.limit !== undefined) params.append("limit", data.limit.toString());
    if (data.q) params.append("q", data.q);
    if (data.sort) params.append("sort", data.sort);
    if (data.order) params.append("order", data.order);
    if (data.username) params.append("username", data.username);
    if (data.email) params.append("email", data.email);
    if (data.is_active !== undefined) params.append("is_active", data.is_active.toString());

    return apiRequest<ApiResponse<PaginatedAdmins>>(
      `/admins?${params.toString()}`,
      {},
      token
    );
  });

// Admin: Get single admin
export const getAdmin = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Admin>>(
      `/admins/${data.id}`,
      {},
      token
    );
  });

// Admin: Create admin
export const createAdmin = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: AdminPayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Admin>>(
      "/admins",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update admin
export const updateAdmin = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { admin: AdminUpdatePayload; id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, admin } = data;

    return apiRequest<ApiResponse<Admin>>(
      `/admins/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(admin),
      },
      token
    );
  });

// Admin: Delete admin
export const deleteAdmin = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<null>>(
      `/admins/${data.id}`,
      { method: "DELETE" },
      token
    );
  });
