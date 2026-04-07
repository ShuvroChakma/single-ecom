/**
 * Metals API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
  purities: Array<Purity>;
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
    return apiRequest<ApiResponse<Array<Metal>>>("/products/metals");
  });

// Admin: Get all metals
export const getMetals = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<Metal>>>("/products/metals");
  });

// Public: Search metals by name/code
export interface MetalSearchResult {
    id: string;
    name: string;
    code: string;
    sort_order: number;
    is_active: boolean;
}

export const searchMetals = createServerFn({ method: "GET" })
    .inputValidator((data: { query: string; limit?: number }) => data)
    .handler(async ({ data }) => {
        const params = new URLSearchParams();
        if (data.query) params.append("q", data.query);
        if (data.limit) params.append("limit", data.limit.toString());

        return apiRequest<ApiResponse<Array<MetalSearchResult>>>(
            `/products/metals/search?${params.toString()}`
        );
    });

// Admin: Get single metal
export const getMetal = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Metal>>(
      `/products/metals/${data.id}`
    );
  });

// Admin: Create metal
export const createMetal = createServerFn({ method: "POST" })
  .inputValidator((data: MetalPayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Metal>>(
      "/products/admin/metals",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update metal
export const updateMetal = createServerFn({ method: "POST" })
  .inputValidator((data: { metal: Partial<MetalPayload>; id: string }) => data)
  .handler(async ({ data }) => {
    const { id, metal } = data;

    return authenticatedRequest<ApiResponse<Metal>>(
      `/products/admin/metals/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(metal),
      }
    );
  });

// Admin: Delete metal
export const deleteMetal = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/metals/${data.id}`,
      { method: "DELETE" }
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
    .inputValidator((data: PurityPayload) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<PurityFull>>(
            "/products/admin/purities",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
    });

// Admin: Update purity
export const updatePurity = createServerFn({ method: "POST" })
    .inputValidator((data: { purity: Partial<PurityPayload>; id: string }) => data)
    .handler(async ({ data }) => {
        const { id, purity } = data;

        return authenticatedRequest<ApiResponse<PurityFull>>(
            `/products/admin/purities/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(purity),
            }
        );
    });

// Admin: Delete purity
export const deletePurity = createServerFn({ method: "POST" })
    .inputValidator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
            `/products/admin/purities/${data.id}`,
            { method: "DELETE" }
        );
    });
