import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export interface AdminTableColumn {
  label: string;
  align?: "left" | "right";
}

interface AdminTableProps {
  /** Tailwind gridTemplateColumns class, e.g. "grid-cols-[1fr_110px_120px_160px]" */
  gridCols: string;
  columns: AdminTableColumn[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  /** Called skeletonCount times when loading */
  renderSkeleton?: () => ReactNode;
  skeletonCount?: number;
  children?: ReactNode;
}

export function AdminTable({
  gridCols,
  columns,
  isLoading,
  isError = false,
  errorMessage = "Không thể tải dữ liệu",
  isEmpty = false,
  emptyMessage = "Chưa có dữ liệu",
  emptyIcon,
  renderSkeleton,
  skeletonCount = 5,
  children,
}: AdminTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header row */}
      <div
        className={`grid ${gridCols} gap-4 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide`}
      >
        {columns.map((col, i) => (
          <span
            key={i}
            className={col.align === "right" ? "text-right" : undefined}
          >
            {col.label}
          </span>
        ))}
      </div>

      {/* Loading */}
      {isLoading && renderSkeleton && (
        <div>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i}>{renderSkeleton()}</div>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-600">{errorMessage}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && isEmpty && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
          {emptyIcon && <div className="opacity-30">{emptyIcon}</div>}
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      )}

      {/* Rows */}
      {!isLoading && !isError && !isEmpty && children}
    </div>
  );
}
