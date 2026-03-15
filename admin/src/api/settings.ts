/**
 * Settings API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { apiRequest } from "./client";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
  .handler(async () => {
    return authenticatedRequest<ApiResponse<Array<Setting>>>("/settings/admin/all");
  });

export const getAdminGroupedSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<SettingsGrouped>>("/settings/admin/grouped");
  });

export const getSettingsByCategory = createServerFn({ method: "GET" })
  .inputValidator((data: { category: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Array<Setting>>>(
      `/settings/admin/category/${data.category}`
    );
  });

export const updateSetting = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string; value: string }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<Setting>>(
      `/settings/admin/${data.key}`,
      {
        method: "PUT",
        body: JSON.stringify({ value: data.value }),
      }
    );
  });

export const bulkUpdateSettings = createServerFn({ method: "POST" })
  .inputValidator((data: { settings: Record<string, string> }) => data)
  .handler(async ({ data }) => {
    return authenticatedRequest<ApiResponse<{ updated_count: number }>>(
      "/settings/admin/bulk",
      {
        method: "PUT",
        body: JSON.stringify({ settings: data.settings }),
      }
    );
  });

export const initializeSettings = createServerFn({ method: "POST" })
  .handler(async () => {
    return authenticatedRequest<ApiResponse<{ created_count: number }>>(
      "/settings/admin/initialize",
      { method: "POST" }
    );
  });
