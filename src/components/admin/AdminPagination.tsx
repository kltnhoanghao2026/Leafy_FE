import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "../ui/Select";

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
    <div className="flex items-center justify-between gap-4 px-1 py-0.5">
      {/* Left: page size + info */}
      <div className="flex items-center gap-3">
        {hasPageSizeControl && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Hiển thị</span>
            <Select
              value={pageSize}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={pageSizeOptions.map((opt) => ({
                value: opt,
                label: String(opt),
              }))}
              size="sm"
              className="w-18"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">hàng</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {totalPages > 1 && (
            <span>Trang {page + 1} / {totalPages}</span>
          )}
          {totalElements != null && itemLabel && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">{totalElements} {itemLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: prev / next */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Trước
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Tiếp
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
