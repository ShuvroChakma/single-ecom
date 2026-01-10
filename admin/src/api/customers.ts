/**
 * Customers API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export interface Customer {
  id: string;
  user_id: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export const getCustomers = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string; limit?: number; offset?: number; search?: string } }) => {
    const query = new URLSearchParams();
    if (data.limit) query.set("limit", data.limit.toString());
    if (data.offset) query.set("offset", data.offset.toString());
    if (data.search) query.set("search", data.search);

    return apiRequest<ApiResponse<Customer[]>>(
      `/admin/customers?${query.toString()}`,
      {},
      data.token
    );
  });

export const getCustomer = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string; token: string } }) => {
    return apiRequest<ApiResponse<Customer>>(
      `/admin/customers/${data.id}`,
      {},
      data.token
    );
  });

export const updateCustomer = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { id: string; customer: Partial<Customer>; token: string } }) => {
    return apiRequest<ApiResponse<Customer>>(
      `/admin/customers/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data.customer),
      },
      data.token
    );
  });

export const toggleCustomerActive = createServerFn({ method: "PATCH" })
  .handler(async ({ data }: { data: { id: string; is_active: boolean; token: string } }) => {
    return apiRequest<ApiResponse<Customer>>(
      `/admin/customers/${data.id}/toggle?is_active=${data.is_active}`,
      { method: "PATCH" },
      data.token
    );
  });
