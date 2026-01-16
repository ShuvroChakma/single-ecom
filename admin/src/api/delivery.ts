/**
 * Delivery Zones API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export type ChargeType = "FIXED" | "WEIGHT_BASED" | "FREE_ABOVE";

export interface DeliveryZone {
  id: string;
  name: string;
  districts: string[];
  charge_type: ChargeType;
  base_charge: number;
  per_kg_charge: number | null;
  free_above_amount: number | null;
  min_delivery_days: number;
  max_delivery_days: number;
  is_active: boolean;
}

export interface DeliveryChargeResult {
  zone_name: string;
  charge_type: ChargeType;
  base_charge: number;
  weight_charge: number;
  total_charge: number;
  free_shipping_applied: boolean;
  estimated_days: string;
}

export const calculateDeliveryCharge = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { district: string; order_amount: number; weight_kg?: number } }) => {
    const query = new URLSearchParams();
    query.set("district", data.district);
    query.set("order_amount", data.order_amount.toString());
    if (data.weight_kg) query.set("weight_kg", data.weight_kg.toString());

    return apiRequest<ApiResponse<DeliveryChargeResult>>(
      `/delivery/charges?${query.toString()}`
    );
  });

export const getDeliveryZones = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<DeliveryZone[]>>(
      "/delivery/admin/zones",
      {},
      data.token
    );
  });

export const createDeliveryZone = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { zone: Partial<DeliveryZone>; token: string } }) => {
    return apiRequest<ApiResponse<DeliveryZone>>(
      "/delivery/admin/zones",
      {
        method: "POST",
        body: JSON.stringify(data.zone),
      },
      data.token
    );
  });

export const updateDeliveryZone = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { id: string; zone: Partial<DeliveryZone>; token: string } }) => {
    return apiRequest<ApiResponse<DeliveryZone>>(
      `/delivery/admin/zones/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.zone),
      },
      data.token
    );
  });

export const deleteDeliveryZone = createServerFn({ method: "DELETE" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<{ deleted: boolean }>>(
      `/delivery/admin/zones/${data.id}`,
      { method: "DELETE" },
      data.token
    );
  });
