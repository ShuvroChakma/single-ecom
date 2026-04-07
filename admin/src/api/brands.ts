/**
 * Brands API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandPayload {
  name: string;
  slug: string;
  logo?: string;
  is_active?: boolean;
}

// Public: Get all brands
export const getPublicBrands = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<Array<Brand>>>("/products/brands");
  });

// Admin: Get all brands
export const getBrands = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<Brand>>>("/products/brands");
  });

// Admin: Create brand
export const createBrand = createServerFn({ method: "POST" })
  .inputValidator((data: BrandPayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Brand>>(
      "/products/admin/brands",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update brand
export const updateBrand = createServerFn({ method: "POST" })
  .inputValidator((data: { brand: Partial<BrandPayload>; id: string }) => data)
  .handler(async ({ data }) => {
    const { id, brand } = data;

    return authenticatedRequest<ApiResponse<Brand>>(
      `/products/admin/brands/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(brand),
      }
    );
  });

// Admin: Delete brand
export const deleteBrand = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/brands/${data.id}`,
      { method: "DELETE" }
    );
  });
