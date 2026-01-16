/**
 * Rates API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface DailyRate {
  id: string;
  metal_id: string | null;
  metal_type: string;
  purity: string;
  rate_per_gram: number;
  currency: string;
  source: "MANUAL" | "BAJUS" | "API";
  effective_date: string;
  created_at: string;
  created_by: string | null;
}

export interface RatePayload {
  metal_id?: string;
  metal_type: string;
  purity: string;
  rate_per_gram: number;
  currency?: string;
  source?: "MANUAL" | "BAJUS" | "API";
  effective_date?: string;
}

export interface CurrentRatesResponse {
  rates: DailyRate[];
  last_updated: string;
}

// Public: Get current rates
export const getCurrentRates = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<CurrentRatesResponse>>(
      "/products/rates/current"
    );
  });

// Public: Get rate history
export const getRateHistory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { metal_type: string; purity: string; limit?: number } }) => {
    const params = new URLSearchParams();
    params.append("metal_type", data.metal_type);
    params.append("purity", data.purity);
    if (data.limit) params.append("limit", data.limit.toString());

    return apiRequest<ApiResponse<DailyRate[]>>(
      `/products/rates/history?${params.toString()}`
    );
  });

// Admin: Add new rate
export const addRate = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: RatePayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<DailyRate>>(
      "/products/admin/rates",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Add rates batch
export const addRatesBatch = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: RatePayload[] }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<DailyRate[]>>(
      "/products/admin/rates/batch",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });
