/**
 * Application Error Types
 * Defines all possible error types and their structures
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface NetworkError extends ApiError {
  code: 'NETWORK_ERROR';
}

export interface TimeoutError extends ApiError {
  code: 'TIMEOUT_ERROR';
}

export interface UnauthorizedError extends ApiError {
  code: 'UNAUTHORIZED';
}

export interface BadRequestError extends ApiError {
  code: 'BAD_REQUEST';
}

export interface ServerError extends ApiError {
  code: 'SERVER_ERROR';
}

export type AppError = ApiError | NetworkError | TimeoutError | UnauthorizedError | BadRequestError | ServerError;

/**
 * Type guard to check if error is an ApiError
 */
export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
};

/**
 * Safely extract error message from various error types
 */
export const getErrorMessage = (error: unknown, defaultMessage = 'An unexpected error occurred'): string => {
  if (typeof error === 'string') return error;
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return defaultMessage;
};

/**
 * Safely extract error code from various error types
 */
export const getErrorCode = (error: unknown, defaultCode = 'UNKNOWN_ERROR'): string => {
  if (isApiError(error)) return error.code;
  if (error instanceof Error) return error.name || defaultCode;
  return defaultCode;
};
