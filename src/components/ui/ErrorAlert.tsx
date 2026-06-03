import { AlertTriangle } from "lucide-react";

interface ErrorAlertProps {
  /** The error message to display. Renders nothing when falsy. */
  error: string | null | undefined;
  /** Optional extra Tailwind classes appended to the container. */
  className?: string;
}

/**
 * ErrorAlert
 *
 * Unified inline error display component. Replaces the ad-hoc
 * `bg-red-50` / `text-red-700` divs scattered across the codebase.
 *
 * @example
 *   <ErrorAlert error={errorMessage} />
 *   <ErrorAlert error={errorMessage} className="mt-4" />
 */
export function ErrorAlert({ error, className }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3${className ? ` ${className}` : ""}`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <p className="text-sm font-semibold text-red-700">{error}</p>
    </div>
  );
}
