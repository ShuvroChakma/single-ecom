/**
 * Orders API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
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
  metal_type: string | null;
  metal_purity: string | null;
  metal_color: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  net_weight: number | null;
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
  gift_message: string | null;
  hide_prices: boolean;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  tax_amount: number;
  total: number;
  currency: string;
  promo_code: string | null;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_transaction_id: string | null;
  paid_at: string | null;
  status: OrderStatus;
  customer_notes: string | null;
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

export interface OrderListParams {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  notes?: string;
}

// Admin: List all orders
export const getOrders = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: OrderListParams }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data.status) params.append("status", data.status);
    if (data.limit !== undefined) params.append("limit", data.limit.toString());
    if (data.offset !== undefined) params.append("offset", data.offset.toString());

    return apiRequest<ApiResponse<OrderListItem[]>>(
      `/orders/admin/all?${params.toString()}`,
      {},
      token
    );
  });

// Admin: Get single order
export const getOrder = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Order>>(
      `/orders/admin/${data.id}`,
      {},
      token
    );
  });

// Admin: Update order status
export const updateOrderStatus = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string; payload: UpdateOrderStatusPayload } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Order>>(
      `/orders/admin/${data.id}/status`,
      {
        method: "PUT",
        body: JSON.stringify(data.payload),
      },
      token
    );
  });

// Admin: Create POS order
export const createPosOrder = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { order: any } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Order>>(
      "/admin/pos/orders",
      {
        method: "POST",
        body: JSON.stringify(data.order),
      },
      token
    );
  });
