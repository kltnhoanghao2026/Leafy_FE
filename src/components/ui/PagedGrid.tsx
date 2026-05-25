import type { ReactNode } from "react";
import { AdminPagination } from "../admin/AdminPagination";

interface PagedGridProps {
  viewMode: "grid" | "list";
  page: number;
  totalPages: number;
  totalElements?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange: (size: number) => void;
  children: ReactNode;
}

export function PagedGrid({
  viewMode,
  page,
  totalPages,
  totalElements,
  itemLabel,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  children,
}: PagedGridProps) {
  return (
    <>
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel={itemLabel}
        onPageChange={onPageChange}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
      />
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">{children}</div>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </>
  );
}
