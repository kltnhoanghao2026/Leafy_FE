import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_SIZE_OPTIONS = [10, 20, 50, 100];

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalElements?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  totalElements,
  itemLabel,
  onPageChange,
  pageSize,
  pageSizeOptions = DEFAULT_SIZE_OPTIONS,
  onPageSizeChange,
}: AdminPaginationProps) {
  const hasPageSizeControl = onPageSizeChange != null && pageSize != null;

  if (totalPages <= 1 && !hasPageSizeControl) return null;

  return (
    <div className="flex items-center justify-between px-1">
      {/* Left: page size selector + page info */}
      <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
        {hasPageSizeControl && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">hàng</span>
          </div>
        )}
        {totalPages > 1 && (
          <span>
            Trang {page + 1} / {totalPages}
          </span>
        )}
        {totalElements != null && itemLabel && (
          <span className="text-slate-400">
            · {totalElements} {itemLabel}
          </span>
        )}
      </div>

      {/* Right: prev / next */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            Trước
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Tiếp
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
