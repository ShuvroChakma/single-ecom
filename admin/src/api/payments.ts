/**
 * Payments API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
  required_fields: Array<string>;
  optional_fields: Array<string>;
  example: Record<string, string>;
}

// Public: Get payment methods for checkout
export const getPaymentMethods = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<{ methods: Array<PaymentMethod> }>>("/payments/methods");
  });

// Admin: Get all payment gateways
export const getPaymentGateways = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<PaymentGateway>>>("/payments/admin/gateways");
  });

// Admin: Get gateway config template
export const getGatewayConfigTemplate = createServerFn({ method: "GET" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<GatewayConfigTemplate>>(
      `/payments/admin/gateways/${data.code}/config-template`
    );
  });

// Admin: Update payment gateway
export const updatePaymentGateway = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; gateway: PaymentGatewayPayload }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<PaymentGateway>>(
      `/payments/admin/gateways/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.gateway),
      }
    );
  });

// Admin: Toggle payment gateway enabled/disabled
export const togglePaymentGateway = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; enabled: boolean }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<PaymentGateway>>(
      `/payments/admin/gateways/${data.id}/toggle?enabled=${data.enabled}`,
      { method: "PATCH" }
    );
  });

// Admin: Initialize default gateways
export const initializeGateways = createServerFn({ method: "POST" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<{ created_count: number }>>(
      "/payments/admin/gateways/initialize",
      { method: "POST" }
    );
  });
