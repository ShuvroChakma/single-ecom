/**
 * Rates API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
  rates: Array<DailyRate>;
  last_updated: string;
}

// Public: Get current rates
export const getCurrentRates = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<CurrentRatesResponse>>("/products/rates/current");
  });

export interface RateHistoryPage {
  items: Array<DailyRate>;
  total: number;
  limit: number;
  offset: number;
}

// Public: Get rate history (paginated, optional date filter)
export const getRateHistory = createServerFn({ method: "GET" })
  .inputValidator((data: { metal_type: string; purity: string; limit?: number; offset?: number; date?: string }) => data)
  .handler(async ({ data }) => {
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
  .inputValidator((data: RatePayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<DailyRate>>(
      "/products/admin/rates",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Add rates batch
export const addRatesBatch = createServerFn({ method: "POST" })
  .inputValidator((data: Array<RatePayload>) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Array<DailyRate>>>(
      "/products/admin/rates/batch",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
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
    return authenticatedRequest<ApiResponse<SyncResult>>(
      "/products/admin/rates/sync-bajus",
      { method: "POST" }
    );
  });
