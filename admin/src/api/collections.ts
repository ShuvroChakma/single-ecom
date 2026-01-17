/**
 * Collections API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionPayload {
  name: string;
  slug: string;
  description?: string;
  banner_image?: string;
  is_active?: boolean;
}

// Public: Get all collections
export const getPublicCollections = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<Collection[]>>("/products/collections");
  });

// Admin: Get all collections
export const getCollections = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Collection[]>>(
      "/products/collections",
      {},
      token
    );
  });

// Admin: Get collection by ID
export const getCollection = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Collection>>(
      `/products/collections/${data.id}`,
      {},
      token
    );
  });

// Admin: Create collection
export const createCollection = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: CollectionPayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Collection>>(
      "/products/admin/collections",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update collection
export const updateCollection = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { collection: Partial<CollectionPayload>; id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, collection } = data;

    return apiRequest<ApiResponse<Collection>>(
      `/products/admin/collections/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(collection),
      },
      token
    );
  });

// Admin: Delete collection
export const deleteCollection = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/collections/${data.id}`,
      { method: "DELETE" },
      token
    );
  });
