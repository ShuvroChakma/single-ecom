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

export interface GetCategoryListRequest {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

export interface GetCategoriesResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const getCategories = createServerFn({ method: "GET" })
    .handler(async ({ data }: { data: GetCategoryListRequest }) => {
    const query = new URLSearchParams();
    if (data?.page) query.set("page", data.page.toString());
    if (data?.limit) query.set("limit", data.limit.toString());
    if (data?.search) query.set("search", data.search);
    if (data?.sort_by) query.set("sort_by", data.sort_by);
    if (data?.sort_order) query.set("sort_order", data.sort_order);

        const token = getCookie("access_token");
        if (!token) {
            throw new Error("Not authenticated");
        }

        return apiRequest<ApiResponse<GetCategoriesResponse>>(
            `/catalog/admin/categories?${query.toString()}`,
            {},
            token
        );
  });

export const getCategory = createServerFn({ method: "GET" })
    .handler(async ({ data }: { data: { id: string } }) => {
        const token = getCookie("access_token");
        if (!token) {
            throw new Error("Not authenticated");
        }

        return apiRequest<ApiResponse<Category>>(
            `/catalog/admin/categories/${data.id}`,
            {},
            token
        );
  });

export interface CategoryTreeResponse extends Category {
  children?: CategoryTreeResponse[];
}

export const getCategoryTree = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<CategoryTreeResponse[]>>(
      "/catalog/categories/tree",
      {},
      token
      );
    });

export const createCategory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: Partial<Category> }) => {
    console.log("createCategory Handler Received Data:", JSON.stringify(data, null, 2));
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Category>>(
        "/catalog/admin/categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

export const updateCategory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { category: Partial<Category>, id: string } }) => {
    console.log("updateCategory Handler Received:", data)
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, category } = data;

    return apiRequest<ApiResponse<Category>>(
      `/catalog/admin/categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(category),
      },
      token
    );
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
        `/catalog/admin/categories/${data.id}`,
      { method: "DELETE" },
      token
    );
  });

export const toggleCategoryActive = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; is_active: boolean; token: string } }) => {
    return apiRequest<ApiResponse<Category>>(
        `/catalog/admin/categories/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" },
      data.token
    );
  });
