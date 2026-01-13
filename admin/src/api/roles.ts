/**
 * Roles API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export interface PaginatedRoles {
  items: Role[];
  total: number;
  page: number;
  per_page: number;
}

// Admin: List roles with pagination
export const getRoles = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data?: { page?: number; per_page?: number } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data?.page) params.append("page", data.page.toString());
    if (data?.per_page) params.append("per_page", data.per_page.toString());

    return apiRequest<ApiResponse<PaginatedRoles>>(
      `/admin/roles?${params.toString()}`,
      {},
      token
    );
  });

// Admin: Get single role
export const getRole = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Role>>(
      `/admin/roles/${data.id}`,
      {},
      token
    );
  });
