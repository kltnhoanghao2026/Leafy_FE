import type { SearchPage, SearchSpringPage } from "./types";

export const normalizeSearchPage = <T>(
  page: SearchSpringPage<T>,
): SearchPage<T> => {
  const currentPage = page.number ?? 0;
  const totalPages = page.totalPages ?? 0;

  return {
    items: page.content ?? [],
    page: currentPage,
    size: page.size ?? 0,
    totalItems: page.totalElements ?? page.content?.length ?? 0,
    totalPages,
    hasPrevious: currentPage > 0,
    hasNext: currentPage + 1 < totalPages,
  };
};
