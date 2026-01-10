/**
 * Orders API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export type OrderStatus = 
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "RETURNED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_sku: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  is_pos_order: boolean;
  pos_customer_name: string | null;
  pos_customer_phone: string | null;
  shipping_address: Record<string, any>;
  is_gift: boolean;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  total: number;
  promo_code: string | null;
  payment_method: string;
  payment_status: PaymentStatus;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OrderListItem {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  item_count: number;
  created_at: string;
}

export const getOrders = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string; status?: string; limit?: number; offset?: number } }) => {
    const query = new URLSearchParams();
    if (data.status) query.set("status", data.status);
    if (data.limit) query.set("limit", data.limit.toString());
    if (data.offset) query.set("offset", data.offset.toString());

    return apiRequest<ApiResponse<OrderListItem[]>>(
      `/orders/admin/all?${query.toString()}`,
      {},
      data.token
    );
  });

export const getOrder = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<Order>>(
      `/orders/admin/${data.id}`,
      {},
      data.token
    );
  });

export const updateOrderStatus = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; status: OrderStatus; notes?: string; token: string } }) => {
    return apiRequest<ApiResponse<Order>>(
      `/orders/admin/${data.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: data.status, notes: data.notes }),
      },
      data.token
    );
  });

export const createPosOrder = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { order: any; token: string } }) => {
    return apiRequest<ApiResponse<Order>>(
      "/admin/pos/orders",
      {
        method: "POST",
        body: JSON.stringify(data.order),
      },
      data.token
    );
  });
