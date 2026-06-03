interface FieldErrorsProps {
  /**
   * Per-field validation errors from `ApiEnvelope.errors`.
   * Renders nothing when undefined or empty.
   */
  errors: Record<string, string> | undefined;
  /** Optional extra Tailwind classes appended to the container. */
  className?: string;
}

/**
 * FieldErrors
 *
 * Displays per-field validation errors returned in the `errors` map of an
 * `ApiEnvelope` (e.g. from a `MethodArgumentNotValidException` on the backend).
 *
 * @example
 *   const { resolveErrors } = useApiError();
 *   <FieldErrors errors={resolveErrors(mutationError)} />
 */
export function FieldErrors({ errors, className }: FieldErrorsProps) {
  if (!errors || Object.keys(errors).length === 0) return null;

  return (
    <ul
      className={`space-y-1${className ? ` ${className}` : ""}`}
      role="list"
      aria-label="Lỗi xác thực"
    >
      {Object.entries(errors).map(([field, msg]) => (
        <li key={field} className="text-sm text-red-600">
          <span className="font-semibold">{field}:</span> {msg}
        </li>
      ))}
    </ul>
  );
}
