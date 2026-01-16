/**
 * Brands API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

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
    return apiRequest<ApiResponse<Brand[]>>("/products/brands");
  });

// Admin: Get all brands
export const getBrands = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Brand[]>>(
      "/products/brands",
      {},
      token
    );
  });

// Admin: Create brand
export const createBrand = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: BrandPayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Brand>>(
      "/products/admin/brands",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update brand
export const updateBrand = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { brand: Partial<BrandPayload>; id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, brand } = data;

    return apiRequest<ApiResponse<Brand>>(
      `/products/admin/brands/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(brand),
      },
      token
    );
  });

// Admin: Delete brand
export const deleteBrand = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/brands/${data.id}`,
      { method: "DELETE" },
      token
    );
  });
