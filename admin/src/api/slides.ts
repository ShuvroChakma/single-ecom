/**
 * Slides API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

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
  start_date?: string;
  end_date?: string;
}

// Public: Get active slides
export const getActiveSlides = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<Slide[]>>("/slides");
  });

// Public: Get slides by type
export const getSlidesByType = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { type: SlideType } }) => {
    return apiRequest<ApiResponse<Slide[]>>(`/slides/type/${data.type}`);
  });

// Admin: Get all slides
export interface PaginatedSlidesResponse {
  items: Slide[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const getSlides = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { page?: number; limit?: number; search?: string; include_inactive?: boolean } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const queryParams = new URLSearchParams();
    if (data?.page) queryParams.append("page", data.page.toString());
    if (data?.limit) queryParams.append("limit", data.limit.toString());
    if (data?.search) queryParams.append("search", data.search);
    if (data?.include_inactive) queryParams.append("include_inactive", "true");

    return apiRequest<ApiResponse<PaginatedSlidesResponse>>(
      `/slides/admin?${queryParams.toString()}`,
      {},
      token
    );
  });

// Admin: Get single slide
export const getSlide = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Slide>>(
      `/slides/admin/${data.id}`,
      {},
      token
    );
  });

// Admin: Create slide
export const createSlide = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: SlidePayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Slide>>(
      "/slides/admin",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update slide
export const updateSlide = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { slide: Partial<SlidePayload>; id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, slide } = data;

    return apiRequest<ApiResponse<Slide>>(
      `/slides/admin/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(slide),
      },
      token
    );
  });

// Admin: Delete slide
export const deleteSlide = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/slides/admin/${data.id}`,
      { method: "DELETE" },
      token
    );
  });

// Admin: Update slide order
export const updateSlideOrder = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { slide_ids: string[] } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ order: string[] }>>(
      "/slides/admin/order",
      {
        method: "PUT",
        body: JSON.stringify({ slide_ids: data.slide_ids }),
      },
      token
    );
  });

// Admin: Toggle slide active
export const toggleSlideActive = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string; is_active: boolean } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Slide>>(
      `/slides/admin/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" },
      token
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

  const API_URL = (typeof process !== 'undefined' && process.env?.API_URL)
    || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
    || "http://localhost:8000/api/v1";

  const response = await fetch(`${API_URL}/slides/admin/upload`, {
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
