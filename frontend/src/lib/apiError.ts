import { isAxiosError } from 'axios';

interface ApiErrorResponse {
  message?: unknown;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
=======
import axios from 'axios';

interface ApiErrorBody {
  message?: string;
  error?: string;
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | string | undefined;
    if (typeof data === 'string') {
      if (data.trim()) {
        return data;
      }
    } else {
      if (data?.message) {
        return data.message;
      }
      if (data?.error) {
        return data.error;
      }
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
