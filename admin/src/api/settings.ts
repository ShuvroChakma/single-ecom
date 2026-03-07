/**
 * Settings API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
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
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");
    return apiRequest<ApiResponse<Setting[]>>("/settings/admin/all", {}, token);
  });

export const getAdminGroupedSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");
    return apiRequest<ApiResponse<SettingsGrouped>>("/settings/admin/grouped", {}, token);
  });

export const getSettingsByCategory = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { category: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");
    return apiRequest<ApiResponse<Setting[]>>(
      `/settings/admin/category/${data.category}`,
      {},
      token
    );
  });

export const updateSetting = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { key: string; value: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");
    return apiRequest<ApiResponse<Setting>>(
      `/settings/admin/${data.key}`,
      {
        method: "PUT",
        body: JSON.stringify({ value: data.value }),
      },
      token
    );
  });

export const bulkUpdateSettings = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { settings: Record<string, string> } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");
    return apiRequest<ApiResponse<{ updated_count: number }>>(
      "/settings/admin/bulk",
      {
        method: "PUT",
        body: JSON.stringify({ settings: data.settings }),
      },
      token
    );
  });

export const initializeSettings = createServerFn({ method: "POST" })
  .handler(async () => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");
    return apiRequest<ApiResponse<{ created_count: number }>>(
      "/settings/admin/initialize",
      { method: "POST" },
      token
    );
  });
