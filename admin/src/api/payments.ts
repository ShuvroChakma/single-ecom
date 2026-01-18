/**
 * Payments API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo_url: string | null;
  is_enabled: boolean;
  is_sandbox: boolean;
  has_config: boolean;
  display_order: number;
  min_amount: number | null;
  max_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentGatewayPayload {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  config?: Record<string, any> | null;
  is_enabled?: boolean;
  is_sandbox?: boolean;
  display_order?: number;
  min_amount?: number | null;
  max_amount?: number | null;
}

export interface PaymentMethod {
  code: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  min_amount: number | null;
  max_amount: number | null;
}

export interface GatewayConfigTemplate {
  gateway_code: string;
  required_fields: string[];
  optional_fields: string[];
  example: Record<string, string>;
}

// Public: Get payment methods for checkout
export const getPaymentMethods = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<{ methods: PaymentMethod[] }>>("/payments/methods");
  });

// Admin: Get all payment gateways
export const getPaymentGateways = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PaymentGateway[]>>(
      "/payments/admin/gateways",
      {},
      token
    );
  });

// Admin: Get gateway config template
export const getGatewayConfigTemplate = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { code: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<GatewayConfigTemplate>>(
      `/payments/admin/gateways/${data.code}/config-template`,
      {},
      token
    );
  });

// Admin: Update payment gateway
export const updatePaymentGateway = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string; gateway: PaymentGatewayPayload } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PaymentGateway>>(
      `/payments/admin/gateways/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.gateway),
      },
      token
    );
  });

// Admin: Toggle payment gateway enabled/disabled
export const togglePaymentGateway = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string; enabled: boolean } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<PaymentGateway>>(
      `/payments/admin/gateways/${data.id}/toggle?enabled=${data.enabled}`,
      { method: "PATCH" },
      token
    );
  });

// Admin: Initialize default gateways
export const initializeGateways = createServerFn({ method: "POST" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<{ created_count: number }>>(
      "/payments/admin/gateways/initialize",
      { method: "POST" },
      token
    );
  });
