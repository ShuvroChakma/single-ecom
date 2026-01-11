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

// ============ PURITY API ============

export interface PurityPayload {
    metal_id: string;
    name: string;
    code: string;
    fineness: number;
    sort_order?: number;
    is_active?: boolean;
}

export interface PurityFull extends Purity {
    metal_id: string;
    created_at: string;
    updated_at: string;
}

// Admin: Create purity
export const createPurity = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: PurityPayload }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<PurityFull>>(
            "/products/admin/purities",
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            token
        );
    });

// Admin: Update purity
export const updatePurity = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { purity: Partial<PurityPayload>; id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        const { id, purity } = data;

        return apiRequest<ApiResponse<PurityFull>>(
            `/products/admin/purities/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(purity),
            },
            token
        );
    });

// Admin: Delete purity
export const deletePurity = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<{ deleted: boolean }>>(
            `/products/admin/purities/${data.id}`,
            { method: "DELETE" },
            token
        );
    });

