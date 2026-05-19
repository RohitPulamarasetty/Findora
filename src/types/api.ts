export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
