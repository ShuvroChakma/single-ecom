/**
 * Standardized API Response Types
 * 
 * All API endpoints return responses in this format for consistency
 * and type safety across the frontend application.
 */

/**
 * Main API response structure
 * @template T - The type of data returned in the response
 */
export interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  errors: APIError[];
  meta: APIMeta;
}

/**
 * Error object structure
 */
export interface APIError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Response metadata
 */
export interface APIMeta {
  timestamp: string;
  pagination?: PaginationMeta;
  [key: string]: any;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Type guard to check if response is successful
 * @param response - The API response to check
 * @returns True if response is successful and has data
 */
export function isSuccessResponse<T>(
  response: APIResponse<T>
): response is APIResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== null;
}

/**
 * Extract data from response or throw error
 * @param response - The API response
 * @returns The data if successful
 * @throws Error if response is not successful
 */
export function unwrapResponse<T>(response: APIResponse<T>): T {
  if (!isSuccessResponse(response)) {
    const errorMessages = response.errors.map(e => e.message).join(', ');
    throw new Error(errorMessages || response.message || 'API request failed');
  }
  return response.data;
}

/**
 * Type guard to check if response has pagination
 * @param response - The API response to check
 * @returns True if response has pagination metadata
 */
export function isPaginatedResponse<T>(
  response: APIResponse<T>
): response is APIResponse<T> & { meta: { pagination: PaginationMeta } } {
  return response.meta?.pagination !== undefined;
}
