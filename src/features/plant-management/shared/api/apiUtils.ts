import type { ApiEnvelope } from '../../../../shared/types/api';
import type { PageResponse } from '../../shared/types';

export const unwrapApiData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    ("code" in payload || "message" in payload)
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

export const unwrapPageContent = <T>(payload: PageResponse<T> | T[]): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.content ?? [];
};
