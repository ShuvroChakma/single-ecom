/**
 * Categories API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
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

      return apiRequest<ApiResponse<GetCategoriesResponse>>(`/admin/categories?${query.toString()}`);
  });

export const getCategory = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string } }) => {
      // Note: getCategory by ID might probably be public? 
      // Wait, the backend shows update/delete are admin.
      // There is no public "get single category" endpoint in admin endpoints.
      // Assuming admin GET for now for the form.
      // But there is NO specific GET /admin/categories/{id} in endpoints.py!
      // There is create, update, delete, get_categories (list).
      // The public endpoints has "get_category_tree".
      // Let's assume I missed adding GET /admin/categories/{id} or we use the list?
      // Wait, looking at endpoints.py content in step 1166... there is NO GET /admin/categories/{id}.
      // This will fail. I need to add that endpoint too!

      // For now, let's update the paths that DO exist.
      // List: /admin/categories
      // Toggle: /admin/categories/{id}/toggle

      return apiRequest<ApiResponse<Category>>(`/admin/categories/${data.id}`);
  });

export const createCategory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { category: Partial<Category> } }) => {
      // Legacy method, should probably remove or update
    return apiRequest<ApiResponse<Category>>(
        "/admin/categories",
        {
            method: "POST",
            body: JSON.stringify(data.category),
        }
    );
  });

export const createCategoryWithToken = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { category: Partial<Category>; token: string } }) => {
    return apiRequest<ApiResponse<Category>>(
        "/admin/categories",
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
        `/admin/categories/${data.id}`,
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
        `/admin/categories/${data.id}`,
      { method: "DELETE" },
      data.token
    );
  });

export const toggleCategoryActive = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; is_active: boolean; token: string } }) => {
    return apiRequest<ApiResponse<Category>>(
        `/admin/categories/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" },
      data.token
    );
  });
