import { useTranslation } from "../i18n/useTranslation";
import { ApiError } from "../lib/apiClient";
import { resolveErrorMessage, resolveFieldErrors } from "../lib/errorMapper";

/**
 * useApiError
 *
 * Provides helpers to resolve an unknown error (typically from a React Query
 * mutation or query) into display-ready values.
 *
 * @example
 *   const { resolve, resolveErrors } = useApiError();
 *
 *   // In onError callback or catch block:
 *   const message = resolve(error);          // translated string
 *   const fields  = resolveErrors(error);    // { fieldName: "msg" } | undefined
 */
export function useApiError() {
  const { t } = useTranslation();

  return {
    /** Resolves an unknown error to a translated, display-ready string. */
    resolve: (error: unknown): string => resolveErrorMessage(error, t),

    /** Extracts per-field validation errors from an ApiError, if present. */
    resolveErrors: (error: unknown): Record<string, string> | undefined =>
      resolveFieldErrors(error),

    /** True when the error is an ApiError with the given code. */
    isCode: (error: unknown, code: number): boolean =>
      error instanceof ApiError && error.code === code,
  };
}
