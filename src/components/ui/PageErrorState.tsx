import { RefreshCw } from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";

interface PageErrorStateProps {
  /**
   * Called when the user clicks the retry button.
   * Typically `() => void query.refetch()` or a multi-query refetch.
   */
  onRetry: () => void;
  /** Override the default error title. */
  title?: string;
  /** Override the default error description. */
  description?: string;
  /** Extra Tailwind classes on the container. */
  className?: string;
}

/**
 * PageErrorState
 *
 * Standard page-level error block shown when a critical data query fails
 * (e.g. 503 Service Unavailable, network error, or any non-401 HTTP error).
 *
 * Mirrors the pattern established in DeviceDetailPage:
 *   - Red card with title + description
 *   - Retry button that calls onRetry()
 *
 * @example
 *   const hasPageError = deviceDetailQuery.isError || configQuery.isError;
 *
 *   {hasPageError && (
 *     <PageErrorState
 *       onRetry={() => {
 *         void deviceDetailQuery.refetch();
 *         void configQuery.refetch();
 *       }}
 *     />
 *   )}
 */
export function PageErrorState({
  onRetry,
  title,
  description,
  className,
}: PageErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={`rounded-4xl border border-red-100 bg-red-50 p-8 shadow-sm${className ? ` ${className}` : ""}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-red-700">
            {title ?? t("common.pageError.title")}
          </h3>
          <p className="mt-1 text-sm font-semibold text-red-600">
            {description ?? t("common.pageError.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}
