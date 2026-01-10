/**
 * Slides API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
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
}

export const getActiveSlides = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<Slide[]>>("/slides");
  });

export const getSlidesByType = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { type: SlideType } }) => {
    return apiRequest<ApiResponse<Slide[]>>(`/slides/type/${data.type}`);
  });

export const getSlides = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string; include_inactive?: boolean } }) => {
    const query = data.include_inactive ? "?include_inactive=true" : "";
    return apiRequest<ApiResponse<Slide[]>>(
      `/slides/admin${query}`,
      {},
      data.token
    );
  });

export const getSlide = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<Slide>>(
      `/slides/admin/${data.id}`,
      {},
      data.token
    );
  });

export const createSlide = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { slide: Partial<Slide>; token: string } }) => {
    return apiRequest<ApiResponse<Slide>>(
      "/slides/admin",
      {
        method: "POST",
        body: JSON.stringify(data.slide),
      },
      data.token
    );
  });

export const updateSlide = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { id: string; slide: Partial<Slide>; token: string } }) => {
    return apiRequest<ApiResponse<Slide>>(
      `/slides/admin/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.slide),
      },
      data.token
    );
  });

export const deleteSlide = createServerFn({ method: "DELETE" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/slides/admin/${data.id}`,
      { method: "DELETE" },
      data.token
    );
  });

export const updateSlideOrder = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { slide_ids: string[]; token: string } }) => {
    return apiRequest<ApiResponse<{ order: string[] }>>(
      "/slides/admin/order",
      {
        method: "PUT",
        body: JSON.stringify({ slide_ids: data.slide_ids }),
      },
      data.token
    );
  });

export const toggleSlideActive = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; is_active: boolean; token: string } }) => {
    return apiRequest<ApiResponse<Slide>>(
      `/slides/admin/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" },
      data.token
    );
  });
