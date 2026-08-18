/**
 * Shared API envelope types. One declaration each — services and pages import
 * from here rather than re-declaring their own.
 */

/** Backend success envelope. `request()` unwraps this, so callers see `T`. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Backend error envelope. */
export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

/**
 * The one paginated-list payload, mirroring the backend's `Paginated<T>`.
 *
 * This replaces the two competing `ListResponse<T>` declarations that used to
 * live in jobService and auditService. They were not duplicates: one keyed the
 * payload `items`, the other `data`. The backend was aligned on `items` first.
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
