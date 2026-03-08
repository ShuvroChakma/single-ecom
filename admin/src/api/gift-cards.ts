/**
 * Gift Cards API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export type GiftCardStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "CANCELLED";

export interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  remaining_balance: number;
  currency: string;
  status: GiftCardStatus;
  recipient_name: string | null;
  recipient_email: string | null;
  personal_message: string | null;
  qr_code_url: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GiftCardListResponse {
  items: GiftCard[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateGiftCardData {
  initial_balance: number;
  recipient_name?: string;
  recipient_email?: string;
  personal_message?: string;
  expires_at?: string;
}

export const getGiftCards = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { page?: number; limit?: number; status?: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams();
    if (data?.page) params.set("page", String(data.page));
    if (data?.limit) params.set("limit", String(data.limit));
    if (data?.status) params.set("status", data.status);

    return apiRequest<ApiResponse<GiftCardListResponse>>(
      `/gift-cards/admin?${params.toString()}`,
      {},
      token
    );
  });

export const createGiftCard = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: CreateGiftCardData }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<GiftCard>>(
      "/gift-cards/admin",
      { method: "POST", body: JSON.stringify(data) },
      token
    );
  });

// method: "POST" is the TanStack server function transport method, not the HTTP verb
// The actual PATCH request is made in the handler below
export const cancelGiftCard = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { cardId: string } }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    return apiRequest<ApiResponse<GiftCard>>(
      `/gift-cards/admin/${data.cardId}/cancel`,
      { method: "PATCH" },
      token
    );
  });
