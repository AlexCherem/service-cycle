import { ApiError } from './apiClient';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error instanceof ApiError &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'message' in error.data
  ) {
    const message = error.data.message;
    if (typeof message === 'string') return message;
    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === 'string')
    )
      return message.join('. ');
  }
  return fallback;
}
