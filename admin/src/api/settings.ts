/**
 * Settings API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest, ApiResponse } from "./client";

export interface SettingsGrouped {
  general: Record<string, string>;
  contact: Record<string, string>;
  social: Record<string, string>;
  shipping: Record<string, string>;
  seo: Record<string, string>;
  appearance: Record<string, string>;
}

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  json_value: Record<string, any> | null;
  category: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

export const getSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiRequest<ApiResponse<SettingsGrouped>>("/settings");
  });

export const getAdminSettings = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<Setting[]>>("/settings/admin/all", {}, data.token);
  });

export const getSettingsByCategory = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { category: string; token: string } }) => {
    return apiRequest<ApiResponse<Setting[]>>(
      `/settings/admin/category/${data.category}`,
      {},
      data.token
    );
  });

export const updateSetting = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { key: string; value: string; token: string } }) => {
    return apiRequest<ApiResponse<Setting>>(
      `/settings/admin/${data.key}`,
      {
        method: "PUT",
        body: JSON.stringify({ value: data.value }),
      },
      data.token
    );
  });

export const bulkUpdateSettings = createServerFn({ method: "PUT" })
  .handler(async ({ data }: { data: { settings: Record<string, string>; token: string } }) => {
    return apiRequest<ApiResponse<{ updated_count: number }>>(
      "/settings/admin/bulk",
      {
        method: "PUT",
        body: JSON.stringify({ settings: data.settings }),
      },
      data.token
    );
  });

export const initializeSettings = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { token: string } }) => {
    return apiRequest<ApiResponse<{ created_count: number }>>(
      "/settings/admin/initialize",
      { method: "POST" },
      data.token
    );
  });
