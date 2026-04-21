import type { ApiEnvelope } from "../../../shared/types/api";
import type { SpringPage } from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

// ── Response types ──────────────────────────────────────────────────────────

export type SyncTaskStatus = "STARTING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface ProfileSyncStartResult {
  taskId: string;
  status: SyncTaskStatus;
}

export interface ProfileSyncStatus {
  taskId: string;
  totalCount: number;
  processedCount: number;
  progressPercent: number;
  lastPosition: string | null;
  status: SyncTaskStatus;
  errorMessage: string | null;
  startedAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
}

export interface PostSyncResult {
  indexedCount: number;
}

export interface FailedEventDto {
  id: string;
  eventId: string | null;
  eventType: string;
  topic: string;
  payload: string | null;
  errorMessage: string | null;
  stackTrace: string | null;
  partition: number;
  offset: number;
  retryCount: number;
  resolved: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

export interface FailedEventsListParams {
  resolved?: boolean;
  keyword?: string;
  hours?: number;
  page?: number;
  size?: number;
}

// ── API calls ───────────────────────────────────────────────────────────────

export const syncApi = {
  startProfileSync: () =>
    apiClient.post<ApiEnvelope<ProfileSyncStartResult>>(
      API_ENDPOINTS.ADMIN.SYNC.PROFILES_START,
    ),

  resumeProfileSync: (taskId: string) =>
    apiClient.post<ApiEnvelope<ProfileSyncStartResult>>(
      API_ENDPOINTS.ADMIN.SYNC.PROFILES_RESUME(taskId),
    ),

  getProfileSyncStatus: (taskId: string) =>
    apiClient.get<ApiEnvelope<ProfileSyncStatus>>(
      API_ENDPOINTS.ADMIN.SYNC.PROFILES_STATUS(taskId),
    ),

  reindexPosts: (size?: number) =>
    apiClient.post<ApiEnvelope<PostSyncResult>>(
      API_ENDPOINTS.ADMIN.SYNC.POSTS_REINDEX,
      null,
      { params: size != null ? { size } : undefined },
    ),

  resetPostIndex: () =>
    apiClient.post<ApiEnvelope<PostSyncResult>>(
      API_ENDPOINTS.ADMIN.SYNC.POSTS_RESET,
    ),

  listFailedEvents: (params: FailedEventsListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<FailedEventDto>>>(
      API_ENDPOINTS.ADMIN.SYNC.FAILED_EVENTS_LIST,
      { params },
    ),

  countFailedEvents: (resolved: boolean) =>
    apiClient.get<ApiEnvelope<number>>(
      API_ENDPOINTS.ADMIN.SYNC.FAILED_EVENTS_COUNT,
      { params: { resolved } },
    ),

  resolveFailedEvent: (id: string) =>
    apiClient.patch<ApiEnvelope<FailedEventDto>>(
      API_ENDPOINTS.ADMIN.SYNC.FAILED_EVENTS_RESOLVE(id),
    ),

  retryFailedEvent: (id: string) =>
    apiClient.post<ApiEnvelope<FailedEventDto>>(
      API_ENDPOINTS.ADMIN.SYNC.FAILED_EVENTS_RETRY(id),
    ),

  retryAllFailedEvents: () =>
    apiClient.post<ApiEnvelope<void>>(
      API_ENDPOINTS.ADMIN.SYNC.FAILED_EVENTS_RETRY_ALL,
    ),
};
