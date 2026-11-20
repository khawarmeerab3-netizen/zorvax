/** Standard API envelope types — every API route returns these. */

/** Successful API response envelope. */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, string | number | boolean>;
}

/** Error API response envelope. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Union of both envelopes. */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** Paginated list envelope. */
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Pagination query params. */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}
