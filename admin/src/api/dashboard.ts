/**
 * Dashboard API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
  recent_orders: Array<RecentOrderItem>;
  low_stock_products: Array<LowStockProduct>;
  sales_chart: Array<SalesDataPoint>;
  order_status_counts: Array<OrderStatusCount>;
}

// Get full dashboard data in a single optimized request
export const getDashboardData = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<DashboardData>>("/admin/dashboard");
  });

// Individual endpoints for partial updates (if needed)
export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<DashboardStats>>("/admin/dashboard/stats");
  });

export const getRecentOrders = createServerFn({ method: "GET" })
  .inputValidator((data: { limit?: number }) => data)
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data.limit) params.append("limit", data.limit.toString());

    return authenticatedRequest<ApiResponse<Array<RecentOrderItem>>>(
      `/admin/dashboard/recent-orders?${params.toString()}`
    );
  });

export const getLowStockProducts = createServerFn({ method: "GET" })
  .inputValidator((data: { threshold?: number; limit?: number }) => data)
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data.threshold) params.append("threshold", data.threshold.toString());
    if (data.limit) params.append("limit", data.limit.toString());

    return authenticatedRequest<ApiResponse<Array<LowStockProduct>>>(
      `/admin/dashboard/low-stock?${params.toString()}`
    );
  });

export const getSalesChartData = createServerFn({ method: "GET" })
  .inputValidator((data: { days?: number }) => data)
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data.days) params.append("days", data.days.toString());

    return authenticatedRequest<ApiResponse<Array<SalesDataPoint>>>(
      `/admin/dashboard/sales-chart?${params.toString()}`
    );
  });
