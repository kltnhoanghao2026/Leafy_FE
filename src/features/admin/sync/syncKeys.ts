import type { FailedEventsListParams } from "./sync.api";

export const syncKeys = {
  all: () => ["adminSync"] as const,
  profileStatus: (taskId: string) =>
    [...syncKeys.all(), "profileStatus", taskId] as const,
  failedEvents: () => [...syncKeys.all(), "failedEvents"] as const,
  failedEventsList: (params: FailedEventsListParams) =>
    [...syncKeys.failedEvents(), "list", params] as const,
  failedEventsCount: (resolved: boolean) =>
    [...syncKeys.failedEvents(), "count", resolved] as const,
};
