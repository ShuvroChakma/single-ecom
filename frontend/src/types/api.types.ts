"""
TypeScript types for standardized API responses.
"""

export interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  errors: APIError[];
  meta: APIMeta;
}

export interface APIError {
  field?: string;
  message: string;
  code?: string;
}

export interface APIMeta {
  timestamp: string;
  pagination?: PaginationMeta;
  [key: string]: any;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Helper function to check if response is successful
export function isSuccessResponse<T>(
  response: APIResponse<T>
): response is APIResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== null;
}

// Helper function to extract data or throw error
export function unwrapResponse<T>(response: APIResponse<T>): T {
  if (!isSuccessResponse(response)) {
    throw new Error(response.message || 'API request failed');
  }
  return response.data;
}
