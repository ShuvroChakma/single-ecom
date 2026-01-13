/**
 * Customers API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export interface Customer {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface CustomerUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  password?: string;
  is_active?: boolean;
}

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  per_page: number;
}

export interface CustomerListParams {
  skip?: number;
  limit?: number;
  q?: string;
  sort?: string;
  order?: string;
  email?: string;
  first_name?: string;
  is_active?: boolean;
}

// Admin: List customers with pagination
export const getCustomers = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: CustomerListParams }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data.skip !== undefined) params.append("skip", data.skip.toString());
    if (data.limit !== undefined) params.append("limit", data.limit.toString());
    if (data.q) params.append("q", data.q);
    if (data.sort) params.append("sort", data.sort);
    if (data.order) params.append("order", data.order);
    if (data.email) params.append("email", data.email);
    if (data.first_name) params.append("first_name", data.first_name);
    if (data.is_active !== undefined) params.append("is_active", data.is_active.toString());

    return apiRequest<ApiResponse<PaginatedCustomers>>(
      `/admin/customers?${params.toString()}`,
      {},
      token
    );
  });

// Admin: Get single customer
export const getCustomer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Customer>>(
      `/admin/customers/${data.id}`,
      {},
      token
    );
  });

// Admin: Create customer
export const createCustomer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: CustomerPayload }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<Customer>>(
      "/admin/customers",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  });

// Admin: Update customer
export const updateCustomer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { customer: CustomerUpdatePayload; id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const { id, customer } = data;

    return apiRequest<ApiResponse<Customer>>(
      `/admin/customers/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(customer),
      },
      token
    );
  });

// Admin: Delete customer
export const deleteCustomer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<null>>(
      `/admin/customers/${data.id}`,
      { method: "DELETE" },
      token
    );
  });
