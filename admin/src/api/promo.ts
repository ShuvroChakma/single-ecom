/**
 * Promo Codes API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export type PromoDiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: PromoDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number | null;
  first_order_only: boolean;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface PromoValidationResult {
  valid: boolean;
  message: string;
  discount_amount: number | null;
  free_shipping: boolean;
  promo_code: string | null;
}

export const validatePromoCode = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { code: string; order_amount: number; token: string } }) => {
    return apiRequest<ApiResponse<PromoValidationResult>>(
      "/promo/validate",
      {
        method: "POST",
        body: JSON.stringify({ code: data.code, order_amount: data.order_amount }),
      },
      data.token
    );
  });

export const getPromoCodes = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<PromoCode[]>>("/promo/admin", {}, data.token);
  });

export const getPromoCode = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<PromoCode>>(
      `/promo/admin/${data.id}`,
      {},
      data.token
    );
  });

export const createPromoCode = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { promo: Partial<PromoCode>; token: string } }) => {
    return apiRequest<ApiResponse<PromoCode>>(
      "/promo/admin",
      {
        method: "POST",
        body: JSON.stringify(data.promo),
      },
      data.token
    );
  });

export const updatePromoCode = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { id: string; promo: Partial<PromoCode>; token: string } }) => {
    return apiRequest<ApiResponse<PromoCode>>(
      `/promo/admin/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.promo),
      },
      data.token
    );
  });

export const deletePromoCode = createServerFn({ method: "DELETE" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/promo/admin/${data.id}`,
      { method: "DELETE" },
      data.token
    );
  });

export const getPromoStats = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<any>>(
      `/promo/admin/${data.id}/stats`,
      {},
      data.token
    );
  });
