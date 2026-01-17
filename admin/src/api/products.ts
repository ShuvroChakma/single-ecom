/**
 * Products API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

// ============ ENUMS ============

export type Gender = "WOMEN" | "MEN" | "KIDS" | "UNISEX";
export type MakingChargeType = "PERCENTAGE" | "FIXED_PER_GRAM" | "FLAT";
// MetalType is dynamic - fetched from metals API (e.g., "GOLD", "SILVER", "PLATINUM")
// Use getMetals() from @/api/metals to get available metal types

// ============ TYPES ============

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  metal_type: string; // Dynamic: fetched from metals API
  metal_purity: string;
  metal_color: string;
  size: string | null;
  gross_weight: number;
  net_weight: number;
  is_default: boolean;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku_base: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  brand_id: string | null;
  collection_id: string | null;
  gender: Gender;
  base_making_charge_type: MakingChargeType;
  base_making_charge_value: number;
  tax_code: string | null;
  is_active: boolean;
  is_featured: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariantPayload {
  sku: string;
  metal_type: string; // Dynamic: fetched from metals API
  metal_purity: string;
  metal_color: string;
  size?: string | null;
  gross_weight: number;
  net_weight: number;
  is_default?: boolean;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface ProductPayload {
  sku_base: string;
  name: string;
  slug: string;
  description?: string | null;
  category_id: string;
  brand_id?: string | null;
  collection_id?: string | null;
  gender?: Gender;
  base_making_charge_type?: MakingChargeType;
  base_making_charge_value?: number;
  tax_code?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  images?: string[];
  variants?: ProductVariantPayload[];
}

export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: string;
  brand_id?: string;
  collection_id?: string;
  gender?: Gender;
  metal_type?: string; // Dynamic: fetched from metals API
  is_featured?: boolean;
  is_active?: boolean;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ============ API FUNCTIONS ============

// Public: Get all products with filters
export const getProducts = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: ProductListParams }) => {
    const query = new URLSearchParams();
    if (data?.page) query.set("page", data.page.toString());
    if (data?.per_page) query.set("per_page", data.per_page.toString());
    if (data?.search) query.set("search", data.search);
    if (data?.category_id) query.set("category_id", data.category_id);
    if (data?.brand_id) query.set("brand_id", data.brand_id);
    if (data?.collection_id) query.set("collection_id", data.collection_id);
    if (data?.gender) query.set("gender", data.gender);
    if (data?.metal_type) query.set("metal_type", data.metal_type);
    if (data?.is_featured !== undefined) query.set("is_featured", data.is_featured.toString());

    return apiRequest<ApiResponse<ProductListResponse>>(`/products?${query.toString()}`);
  });

// Admin: Get all products with filters (includes inactive)
export const getAdminProducts = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: ProductListParams }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const query = new URLSearchParams();
    if (data?.page) query.set("page", data.page.toString());
    if (data?.per_page) query.set("per_page", data.per_page.toString());
    if (data?.search) query.set("search", data.search);
    if (data?.category_id) query.set("category_id", data.category_id);
    if (data?.brand_id) query.set("brand_id", data.brand_id);
    if (data?.collection_id) query.set("collection_id", data.collection_id);
    if (data?.gender) query.set("gender", data.gender);
    if (data?.metal_type) query.set("metal_type", data.metal_type);
    if (data?.is_featured !== undefined) query.set("is_featured", data.is_featured.toString());
    if (data?.is_active !== undefined) query.set("is_active", data.is_active.toString());

    return apiRequest<ApiResponse<ProductListResponse>>(
      `/products?${query.toString()}`,
      {},
      token
    );
  });

// Public: Get product by slug
export const getProductBySlug = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { slug: string } }) => {
    return apiRequest<ApiResponse<Product>>(`/products/${data.slug}`);
  });

// Admin: Get product by ID
export const getProductById = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Product>>(
      `/products/${data.id}`,
      {},
      token
    );
  });

// Admin: Create product
export const createProduct = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: ProductPayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Product>>(
      "/products/admin/products",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update product
export const updateProduct = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string; product: Partial<ProductPayload> } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Product>>(
      `/products/admin/products/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.product),
      },
      token
    );
  });

// Admin: Delete product
export const deleteProduct = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/products/${data.id}`,
      { method: "DELETE" },
      token
    );
  });

// Admin: Create variant
export const createVariant = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { productId: string; variant: ProductVariantPayload } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<ProductVariant>>(
      `/products/admin/products/${data.productId}/variants`,
      {
        method: "POST",
        body: JSON.stringify(data.variant),
      },
      token
    );
  });

// Admin: Update variant
export const updateVariant = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { variantId: string; variant: Partial<ProductVariantPayload> } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<ProductVariant>>(
      `/products/admin/variants/${data.variantId}`,
      {
        method: "PUT",
        body: JSON.stringify(data.variant),
      },
      token
    );
  });

// Admin: Delete variant
export const deleteVariant = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { variantId: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/variants/${data.variantId}`,
      { method: "DELETE" },
      token
    );
  });
