export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}
