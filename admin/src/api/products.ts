/**
 * Products API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand_id: string | null;
  collection_id: string | null;
  category_id: string | null;
  is_active: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  metal_type: string | null;
  metal_purity: string | null;
  metal_color: string | null;
  size: string | null;
  net_weight: number | null;
  gross_weight: number | null;
  making_charge_type: string;
  making_charge: number;
  stock_quantity: number;
  is_active: boolean;
}

export const getProducts = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { page?: number; limit?: number; search?: string } }) => {
    const query = new URLSearchParams();
    if (data?.page) query.set("page", data.page.toString());
    if (data?.limit) query.set("limit", data.limit.toString());
    if (data?.search) query.set("search", data.search);

    return apiRequest<ApiResponse<Product[]>>(`/products?${query.toString()}`);
  });

export const getProduct = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { slug: string } }) => {
    return apiRequest<ApiResponse<Product>>(`/products/${data.slug}`);
  });

export const getProductById = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<Product>>(
      `/products/admin/${data.id}`,
      {},
      data.token
    );
  });

export const createProduct = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { product: Partial<Product>; token: string } }) => {
    return apiRequest<ApiResponse<Product>>(
      "/products/admin",
      {
        method: "POST",
        body: JSON.stringify(data.product),
      },
      data.token
    );
  });

export const updateProduct = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { id: string; product: Partial<Product>; token: string } }) => {
    return apiRequest<ApiResponse<Product>>(
      `/products/admin/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.product),
      },
      data.token
    );
  });

export const deleteProduct = createServerFn({ method: "DELETE" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/${data.id}`,
      { method: "DELETE" },
      data.token
    );
  });

export const toggleProductActive = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; is_active: boolean; token: string } }) => {
    return apiRequest<ApiResponse<Product>>(
      `/products/admin/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" },
      data.token
    );
  });
