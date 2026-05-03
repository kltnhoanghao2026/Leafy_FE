import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { notificationApi } from "../api/notification.api";
import { notificationKeys } from "./keys";

/** Polls unread count + lastCheckedAt. Always active once the user is logged in. */
export const useNotificationState = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.state(),
    queryFn: () => notificationApi.getState(),
    staleTime: 30_000, // 30 s — re-validate in background, not on every render
    enabled,
  });

/**
 * Cursor-based infinite scroll for the notification dropdown.
 * `enabled` defaults to `true` so the first page is pre-fetched in the
 * background before the user opens the dropdown.
 */
export const useNotificationHistory = (unreadOnly = false, enabled = true) =>
  useInfiniteQuery({
    queryKey: notificationKeys.history(unreadOnly),
    queryFn: async ({ pageParam }) => {
      if (unreadOnly) {
        return notificationApi.getUnreadHistory({ cursor: pageParam });
      }
      return notificationApi.getHistory({ cursor: pageParam });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const items = lastPage.data;
      // Backend returns `limit` items (default 20) — if fewer, no more pages
      if (!items || items.length < 20) return undefined;
      return items[items.length - 1].occurredAt; // ISO-8601 cursor
    },
    staleTime: 30_000,
    enabled,
  });
