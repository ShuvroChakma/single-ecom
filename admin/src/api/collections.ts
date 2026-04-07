/**
 * Collections API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
    return apiRequest<ApiResponse<Array<Collection>>>("/products/collections");
  });

// Admin: Get all collections
export const getCollections = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<Collection>>>("/products/collections");
  });

// Admin: Get collection by ID
export const getCollection = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Collection>>(
      `/products/collections/${data.id}`
    );
  });

// Admin: Create collection
export const createCollection = createServerFn({ method: "POST" })
  .inputValidator((data: CollectionPayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Collection>>(
      "/products/admin/collections",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update collection
export const updateCollection = createServerFn({ method: "POST" })
  .inputValidator((data: { collection: Partial<CollectionPayload>; id: string }) => data)
  .handler(async ({ data }) => {
    const { id, collection } = data;

    return authenticatedRequest<ApiResponse<Collection>>(
      `/products/admin/collections/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(collection),
      }
    );
  });

// Admin: Delete collection
export const deleteCollection = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
      `/products/admin/collections/${data.id}`,
      { method: "DELETE" }
    );
  });
