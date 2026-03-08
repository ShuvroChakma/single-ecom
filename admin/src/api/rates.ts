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

export interface RateHistoryPage {
  items: DailyRate[];
  total: number;
  limit: number;
  offset: number;
}

// Public: Get rate history (paginated, optional date filter)
export const getRateHistory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { metal_type: string; purity: string; limit?: number; offset?: number; date?: string } }) => {
    const params = new URLSearchParams();
    params.append("metal_type", data.metal_type);
    params.append("purity", data.purity);
    if (data.limit) params.append("limit", data.limit.toString());
    if (data.offset) params.append("offset", data.offset.toString());
    if (data.date) params.append("date", data.date);

    return apiRequest<ApiResponse<RateHistoryPage>>(
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

export interface SyncResult {
  synced: number;
  skipped: number;
  source: string;
  message: string;
}

export const syncBajusRates = createServerFn({ method: "POST" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<SyncResult>>(
      "/products/admin/rates/sync-bajus",
      { method: "POST" },
      token
    );
  });
