/**
 * Slides API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

export type SlideType = "BANNER" | "PROMO" | "OFFER" | "COLLECTION";

export interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  image_alt: string | null;
  link_url: string | null;
  link_text: string | null;
  slide_type: SlideType;
  text_color: string | null;
  overlay_color: string | null;
  sort_order: number;
  is_active: boolean;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlidePayload {
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  image_alt?: string;
  link_url?: string;
  link_text?: string;
  slide_type?: SlideType;
  text_color?: string;
  overlay_color?: string;
  sort_order?: number;
  is_active?: boolean;
  position?: string;
  start_date?: string;
  end_date?: string;
}

// Public: Get active slides
export const getActiveSlides = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<Array<Slide>>>("/slides");
  });

// Public: Get slides by type
export const getSlidesByType = createServerFn({ method: "GET" })
  .inputValidator((data: { type: SlideType }) => data)
  .handler(async ({ data }) => {
    return apiRequest<ApiResponse<Array<Slide>>>(`/slides/type/${data.type}`);
  });

// Admin: Get all slides
export interface PaginatedSlidesResponse {
  items: Array<Slide>;
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const getSlides = createServerFn({ method: "GET" })
  .inputValidator((data?: { page?: number; limit?: number; search?: string; include_inactive?: boolean }) => data)
  .handler(async ({ data }) => {
    const queryParams = new URLSearchParams();
    if (data?.page) queryParams.append("page", data.page.toString());
    if (data?.limit) queryParams.append("limit", data.limit.toString());
    if (data?.search) queryParams.append("search", data.search);
    if (data?.include_inactive) queryParams.append("include_inactive", "true");

    return authenticatedRequest<ApiResponse<PaginatedSlidesResponse>>(
      `/slides/admin?${queryParams.toString()}`
    );
  });

// Admin: Get single slide
export const getSlide = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Slide>>(`/slides/admin/${data.id}`);
  });

// Admin: Create slide
export const createSlide = createServerFn({ method: "POST" })
  .inputValidator((data: SlidePayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Slide>>(
      "/slides/admin",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update slide
export const updateSlide = createServerFn({ method: "POST" })
  .inputValidator((data: { slide: Partial<SlidePayload>; id: string }) => data)
  .handler(async ({ data }) => {
    const { id, slide } = data;

    return authenticatedRequest<ApiResponse<Slide>>(
      `/slides/admin/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(slide),
      }
    );
  });

// Admin: Delete slide
export const deleteSlide = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
      `/slides/admin/${data.id}`,
      { method: "DELETE" }
    );
  });

// Admin: Update slide order
export const updateSlideOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { slide_ids: Array<string> }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ order: Array<string> }>>(
      "/slides/admin/order",
      {
        method: "PUT",
        body: JSON.stringify({ slide_ids: data.slide_ids }),
      }
    );
  });

// Admin: Toggle slide active
export const toggleSlideActive = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; is_active: boolean }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Slide>>(
      `/slides/admin/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" }
    );
  });

// Upload slide image (client-side)
export interface SlideImageResponse {
  url: string;
  filename: string;
}

export async function uploadSlideImage(file: File, token?: string): Promise<SlideImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (!token) {
    throw new Error("Not authenticated");
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  const response = await fetch(`${apiUrl}/slides/admin/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Failed to upload image");
  }

  const result = await response.json();
  return result.data;
}
