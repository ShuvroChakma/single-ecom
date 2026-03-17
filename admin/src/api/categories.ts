/**
 * Categories API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image: string | null;
  is_active: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at: string;
  updated_at: string;
  subcategories?: Array<Category>;
}

export interface GetCategoryListRequest {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

export interface GetCategoriesResponse {
  items: Array<Category>;
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const getCategories = createServerFn({ method: "GET" })
    .inputValidator((data: GetCategoryListRequest) => data)
    .handler(async ({ data }) => {
    const query = new URLSearchParams();
    if (data.page) query.set("page", data.page.toString());
    if (data.limit) query.set("limit", data.limit.toString());
    if (data.search) query.set("search", data.search);
    if (data.sort_by) query.set("sort_by", data.sort_by);
    if (data.sort_order) query.set("sort_order", data.sort_order);

    return authenticatedRequest<ApiResponse<GetCategoriesResponse>>(
        `/catalog/admin/categories?${query.toString()}`
    );
  });

export const getCategory = createServerFn({ method: "GET" })
    .inputValidator((data: { id: string }) => data)
    .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Category>>(
        `/catalog/admin/categories/${data.id}`
    );
  });

export interface CategoryTreeResponse extends Category {
  children?: Array<CategoryTreeResponse>;
}

export const getCategoryTree = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<CategoryTreeResponse>>>(
      "/catalog/categories/tree"
    );
  });

export const createCategory = createServerFn({ method: "POST" })
  .inputValidator((data: Partial<Category>) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Category>>(
        "/catalog/admin/categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

export const updateCategory = createServerFn({ method: "POST" })
  .inputValidator((data: { category: Partial<Category>, id: string }) => data)
  .handler(async ({ data }) => {
    const { id, category } = data;

    return authenticatedRequest<ApiResponse<Category>>(
      `/catalog/admin/categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(category),
      }
    );
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
        `/catalog/admin/categories/${data.id}`,
      { method: "DELETE" }
    );
  });

export const toggleCategoryActive = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; is_active: boolean }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Category>>(
      `/catalog/admin/categories/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" }
    );
  });
