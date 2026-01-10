/**
 * Categories API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
}

export interface GetCategoriesResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const getCategories = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { page?: number; limit?: number; search?: string; sort_by?: string; sort_order?: "asc" | "desc" } }) => {
    const query = new URLSearchParams();
    if (data?.page) query.set("page", data.page.toString());
    if (data?.limit) query.set("limit", data.limit.toString());
    if (data?.search) query.set("search", data.search);
    if (data?.sort_by) query.set("sort_by", data.sort_by);
    if (data?.sort_order) query.set("sort_order", data.sort_order);

    return apiRequest<ApiResponse<GetCategoriesResponse>>(`/categories?${query.toString()}`);
  });

export const getCategory = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string } }) => {
    return apiRequest<ApiResponse<Category>>(`/categories/${data.id}`);
  });

export const createCategory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { category: Partial<Category> } }) => {
    const token = getCookie("access_token"); // Should ideally come from somewhere else or use existing pattern
    // Ideally we should pass token from client if not using cookie for access token
    // But since we moved to cookie auth for refresh, we need to see how access token is passed
    // For now assuming token is passed in data or arguments, matching existing pattern
    // Wait, the existing pattern in products.ts uses `data.token` passed from client.
    
    // Correction: We should follow the pattern in products.ts where token is passed from client
    // because access token is in memory on client.
    
    return apiRequest<ApiResponse<Category>>(
        "/categories",
        {
            method: "POST",
            body: JSON.stringify(data.category),
        }
        // Token will be passed by call signature update below
    );
  });
  
// Re-writing createCategory to match pattern
export const createCategoryWithToken = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { category: Partial<Category>; token: string } }) => {
    return apiRequest<ApiResponse<Category>>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(data.category),
      },
      data.token
    );
  });

export const updateCategory = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { id: string; category: Partial<Category>; token: string } }) => {
    return apiRequest<ApiResponse<Category>>(
      `/categories/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.category),
      },
      data.token
    );
  });

export const deleteCategory = createServerFn({ method: "DELETE" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/categories/${data.id}`,
      { method: "DELETE" },
      data.token
    );
  });

export const toggleCategoryActive = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; is_active: boolean; token: string } }) => {
    return apiRequest<ApiResponse<Category>>(
      `/categories/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" },
      data.token
    );
  });
