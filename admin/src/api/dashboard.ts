/**
 * Dashboard API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

// Types
export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  orders_today: number;
  revenue_today: number;
}

export interface RecentOrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  variant_info: string | null;
}

export interface SalesDataPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_orders: RecentOrderItem[];
  low_stock_products: LowStockProduct[];
  sales_chart: SalesDataPoint[];
  order_status_counts: OrderStatusCount[];
}

// Get full dashboard data in a single optimized request
export const getDashboardData = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<DashboardData>>(
      "/admin/dashboard",
      {},
      token
    );
  });

// Individual endpoints for partial updates (if needed)
export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<DashboardStats>>(
      "/admin/dashboard/stats",
      {},
      token
    );
  });

export const getRecentOrders = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { limit?: number } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data.limit) params.append("limit", data.limit.toString());

    return apiRequest<ApiResponse<RecentOrderItem[]>>(
      `/admin/dashboard/recent-orders?${params.toString()}`,
      {},
      token
    );
  });

export const getLowStockProducts = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { threshold?: number; limit?: number } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data.threshold) params.append("threshold", data.threshold.toString());
    if (data.limit) params.append("limit", data.limit.toString());

    return apiRequest<ApiResponse<LowStockProduct[]>>(
      `/admin/dashboard/low-stock?${params.toString()}`,
      {},
      token
    );
  });

export const getSalesChartData = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { days?: number } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data.days) params.append("days", data.days.toString());

    return apiRequest<ApiResponse<SalesDataPoint[]>>(
      `/admin/dashboard/sales-chart?${params.toString()}`,
      {},
      token
    );
  });
