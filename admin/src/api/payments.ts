/**
 * Payments API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_enabled: boolean;
  is_sandbox: boolean;
  config: Record<string, any> | null;
  display_order: number;
}

export interface PaymentMethod {
  code: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  min_amount: number | null;
  max_amount: number | null;
}

export const getPaymentMethods = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<PaymentMethod[]>>("/payments/methods");
  });

export const getPaymentGateways = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<PaymentGateway[]>>(
      "/payments/admin/gateways",
      {},
      data.token
    );
  });

export const getGatewayConfigTemplate = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { code: string; token: string } }) => {
    return apiRequest<ApiResponse<any>>(
      `/payments/admin/gateways/${data.code}/config-template`,
      {},
      data.token
    );
  });

export const updatePaymentGateway = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { id: string; config: Partial<PaymentGateway>; token: string } }) => {
    return apiRequest<ApiResponse<PaymentGateway>>(
      `/payments/admin/gateways/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.config),
      },
      data.token
    );
  });

export const togglePaymentGateway = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; enabled: boolean; token: string } }) => {
    return apiRequest<ApiResponse<PaymentGateway>>(
      `/payments/admin/gateways/${data.id}/toggle?enabled=${data.enabled}`,
      { method: "PATCH" },
      data.token
    );
  });

export const initializeGateways = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<{ created_count: number }>>(
      "/payments/admin/gateways/initialize",
      { method: "POST" },
      data.token
    );
  });
