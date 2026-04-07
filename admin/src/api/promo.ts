/**
 * Promo Codes API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
    return authenticatedRequest<ApiResponse<Array<PromoCode>>>(
      "/promo/admin?include_inactive=true"
    );
  });

// Admin: Get single promo code
export const getPromoCode = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<PromoCode>>(`/promo/admin/${data.id}`);
  });

// Admin: Create promo code
export const createPromoCode = createServerFn({ method: "POST" })
  .inputValidator((data: PromoCodePayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<PromoCode>>(
      "/promo/admin",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update promo code
export const updatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((data: { promo: Partial<PromoCodePayload>; id: string }) => data)
  .handler(async ({ data }) => {
    const { id, promo } = data;

    return authenticatedRequest<ApiResponse<PromoCode>>(
      `/promo/admin/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(promo),
      }
    );
  });

// Admin: Delete promo code
export const deletePromoCode = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
      `/promo/admin/${data.id}`,
      { method: "DELETE" }
    );
  });

// Admin: Get promo code stats
export const getPromoCodeStats = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<PromoCodeStats>>(
      `/promo/admin/${data.id}/stats`
    );
  });

// Customer: Validate promo code
export const validatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; order_amount: number }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<PromoValidationResult>>(
      "/promo/validate",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });
