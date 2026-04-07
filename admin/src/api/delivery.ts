/**
 * Delivery Zones API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

export type ChargeType = "FIXED" | "WEIGHT_BASED";

export interface DeliveryZone {
  id: string;
  name: string;
  districts: Array<string>;
  charge_type: ChargeType;
  base_charge: number;
  per_kg_charge: number | null;
  free_above: number | null;
  min_days: number;
  max_days: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZonePayload {
  name: string;
  districts: Array<string>;
  charge_type: ChargeType;
  base_charge: number;
  per_kg_charge?: number | null;
  free_above?: number | null;
  min_days: number;
  max_days: number;
  is_active?: boolean;
  display_order?: number;
}

export interface DeliveryChargeResult {
  zone_name: string;
  charge_type: ChargeType;
  base_charge: number;
  weight_charge: number;
  total_charge: number;
  is_free: boolean;
  free_above: number | null;
  estimated_days: string;
}

// Public: Calculate delivery charge
export const calculateDeliveryCharge = createServerFn({ method: "GET" })
  .inputValidator((data: { district: string; order_amount: number; weight_kg?: number }) => data)
  .handler(async ({ data }) => {
    const query = new URLSearchParams();
    query.set("district", data.district);
    query.set("order_amount", data.order_amount.toString());
    if (data.weight_kg) query.set("weight_kg", data.weight_kg.toString());

    return apiRequest<ApiResponse<DeliveryChargeResult>>(
      `/delivery/charges?${query.toString()}`
    );
  });

// Admin: Get all delivery zones
export const getDeliveryZones = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<DeliveryZone>>>("/delivery/admin/zones");
  });

// Admin: Create delivery zone
export const createDeliveryZone = createServerFn({ method: "POST" })
  .inputValidator((data: DeliveryZonePayload) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<DeliveryZone>>(
      "/delivery/admin/zones",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  });

// Admin: Update delivery zone
export const updateDeliveryZone = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; zone: Partial<DeliveryZonePayload> }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<DeliveryZone>>(
      `/delivery/admin/zones/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.zone),
      }
    );
  });

// Admin: Delete delivery zone
export const deleteDeliveryZone = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ deleted: boolean }>>(
      `/delivery/admin/zones/${data.id}`,
      { method: "DELETE" }
    );
  });
