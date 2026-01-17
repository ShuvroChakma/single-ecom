/**
 * Promo Codes API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number | null;
  max_total_uses: number | null;
  max_uses_per_user: number;
  current_uses: number;
  starts_at: string;
  expires_at: string;
  first_order_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoCodePayload {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount?: number;
  min_order_amount?: number;
  max_total_uses?: number;
  max_uses_per_user?: number;
  starts_at: string;
  expires_at: string;
  first_order_only?: boolean;
  is_active?: boolean;
}

export interface PromoValidationResult {
  valid: boolean;
  code: string;
  discount_type: DiscountType | null;
  discount_value: number | null;
  discount_amount: number | null;
  message: string;
  new_total: number | null;
  free_shipping: boolean;
}

export interface PromoCodeStats {
  total_uses: number;
  total_discount_given: number;
  unique_customers: number;
}

// Admin: Get all promo codes
export const getPromoCodes = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PromoCode[]>>(
      "/promo/admin?include_inactive=true",
      {},
      token
    );
  });

// Admin: Get single promo code
export const getPromoCode = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PromoCode>>(
      `/promo/admin/${data.id}`,
      {},
      token
    );
  });

// Admin: Create promo code
export const createPromoCode = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: PromoCodePayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PromoCode>>(
      "/promo/admin",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update promo code
export const updatePromoCode = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { promo: Partial<PromoCodePayload>; id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, promo } = data;

    return apiRequest<ApiResponse<PromoCode>>(
      `/promo/admin/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(promo),
      },
      token
    );
  });

// Admin: Delete promo code
export const deletePromoCode = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/promo/admin/${data.id}`,
      { method: "DELETE" },
      token
    );
  });

// Admin: Get promo code stats
export const getPromoCodeStats = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PromoCodeStats>>(
      `/promo/admin/${data.id}/stats`,
      {},
      token
    );
  });

// Customer: Validate promo code
export const validatePromoCode = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { code: string; order_amount: number } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PromoValidationResult>>(
      "/promo/validate",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });
