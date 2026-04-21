import { ExternalLink } from "lucide-react";

interface AdminDetailButtonProps {
  onClick: () => void;
  /** Text label shown next to the icon. Defaults to "Xem chi tiết". Pass `null` for icon-only. */
  label?: string | null;
}

/**
 * Shared "navigate to detail" button used across all AdminTable row panels.
 * Shows the ExternalLink icon plus an optional label.
 */
export function AdminDetailButton({
  onClick,
  label = "Xem chi tiết",
}: AdminDetailButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Xem chi tiết"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 ring-1 ring-slate-200 transition-colors"
    >
      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
      {label && <span>{label}</span>}
    </button>
  );
}
