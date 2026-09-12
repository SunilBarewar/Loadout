import "server-only";

import { getSessionHistoryPage } from "./repository";
import { mapHistorySessionItem } from "./formatters";
import type { HistoryPageData } from "./schemas";

const DEFAULT_PAGE_SIZE = 10;

export async function getHistoryPageData(
  userId: string,
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<HistoryPageData> {
  const safePageSize = Math.max(1, Math.min(pageSize, 50));
  const initialPage = Math.max(1, page);

  const firstPass = await getSessionHistoryPage({
    userId,
    page: initialPage,
    pageSize: safePageSize,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(firstPass.totalItems / safePageSize)
  );
  const normalizedPage = Math.min(initialPage, totalPages);

  const result =
    normalizedPage === initialPage
      ? firstPass
      : await getSessionHistoryPage({
          userId,
          page: normalizedPage,
          pageSize: safePageSize,
        });

  return {
    items: result.items.map(mapHistorySessionItem),
    pagination: {
      page: normalizedPage,
      pageSize: safePageSize,
      totalItems: result.totalItems,
      totalPages,
    },
  };
}
