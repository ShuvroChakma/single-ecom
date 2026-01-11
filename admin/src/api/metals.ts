/**
 * Metals API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface Purity {
  id: string;
  name: string;
  code: string;
  fineness: number;
  sort_order: number;
  is_active: boolean;
}

export interface Metal {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  is_active: boolean;
  purities: Purity[];
  created_at: string;
  updated_at: string;
}

export interface MetalPayload {
  name: string;
  code: string;
  sort_order?: number;
  is_active?: boolean;
}

// Public: Get all metals with purities
export const getPublicMetals = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<Metal[]>>("/products/metals");
  });

// Admin: Get all metals
export const getMetals = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Metal[]>>(
      "/products/metals",
      {},
      token
    );
  });

// Admin: Get single metal
export const getMetal = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Metal>>(
      `/products/metals/${data.id}`,
      {},
      token
    );
  });

// Admin: Create metal
export const createMetal = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: MetalPayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Metal>>(
      "/products/admin/metals",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update metal
export const updateMetal = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { metal: Partial<MetalPayload>; id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, metal } = data;

    return apiRequest<ApiResponse<Metal>>(
      `/products/admin/metals/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(metal),
      },
      token
    );
  });

// Admin: Delete metal
export const deleteMetal = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/metals/${data.id}`,
      { method: "DELETE" },
      token
    );
  });
