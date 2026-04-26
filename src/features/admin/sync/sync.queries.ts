import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { syncApi } from "./sync.api";
import type { FailedEventsListParams, SyncTaskStatus } from "./sync.api";
import { syncKeys } from "./syncKeys";

export const useStartProfileSync = () =>
  useMutation({
    mutationFn: () => syncApi.startProfileSync(),
    onError: () => toast.error("Không thể khởi động đồng bộ hồ sơ"),
  });

export const useResumeProfileSync = () =>
  useMutation({
    mutationFn: (taskId: string) => syncApi.resumeProfileSync(taskId),
    onError: () => toast.error("Không thể tiếp tục tác vụ đồng bộ"),
  });

const ACTIVE_STATUSES: SyncTaskStatus[] = ["STARTING", "RUNNING"];

export const useProfileSyncStatus = (taskId: string | null) =>
  useQuery({
    queryKey: syncKeys.profileStatus(taskId ?? ""),
    queryFn: () => syncApi.getProfileSyncStatus(taskId!),
    select: (res) => res.data.data,
    enabled: taskId != null,
    refetchInterval: (query) => {
      // query.state.data is the raw AxiosResponse (before select); navigate to status safely
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status: unknown = (query.state.data as any)?.data?.data?.status;
      return typeof status === "string" &&
        ACTIVE_STATUSES.includes(status as SyncTaskStatus)
        ? 2000
        : false;
    },
  });

export const useReindexPosts = () =>
  useMutation({
    mutationFn: (size?: number) => syncApi.reindexPosts(size),
    onSuccess: (res) => {
      const count = res.data.data?.indexedCount ?? 0;
      toast.success(`Tái lập chỉ mục bài viết: ${count.toLocaleString()} bài`);
    },
    onError: () => toast.error("Tái lập chỉ mục bài viết thất bại"),
  });

export const useResetPostIndex = () =>
  useMutation({
    mutationFn: () => syncApi.resetPostIndex(),
    onSuccess: () => toast.success("Đã xoá và khởi tạo lại chỉ mục bài viết"),
    onError: () => toast.error("Xoá chỉ mục bài viết thất bại"),
  });

export const useReindexProfiles = () =>
  useMutation({
    mutationFn: (size?: number) => syncApi.reindexProfiles(size),
    onSuccess: (res) => {
      const count = res.data.data?.indexedCount ?? 0;
      toast.success(`Tái lập chỉ mục hồ sơ: ${count.toLocaleString()} hồ sơ`);
    },
    onError: () => toast.error("Tái lập chỉ mục hồ sơ thất bại"),
  });

export const useResetProfileIndex = () =>
  useMutation({
    mutationFn: () => syncApi.resetProfileIndex(),
    onSuccess: () => toast.success("Đã xoá và khởi tạo lại chỉ mục hồ sơ"),
    onError: () => toast.error("Xoá chỉ mục hồ sơ thất bại"),
  });

// ── Failed Events ────────────────────────────────────────────────────────────

export const useFailedEvents = (params: FailedEventsListParams = {}) =>
  useQuery({
    queryKey: syncKeys.failedEventsList(params),
    queryFn: () => syncApi.listFailedEvents(params),
    select: (res) => res.data.data,
    staleTime: 30_000,
  });

export const useFailedEventsCount = (resolved: boolean) =>
  useQuery({
    queryKey: syncKeys.failedEventsCount(resolved),
    queryFn: () => syncApi.countFailedEvents(resolved),
    select: (res) => res.data.data ?? 0,
    staleTime: 30_000,
  });

export const useResolveFailedEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => syncApi.resolveFailedEvent(id),
    onSuccess: () => {
      toast.success("Đã đánh dấu sự kiện là đã xử lý");
      queryClient.invalidateQueries({ queryKey: syncKeys.failedEvents() });
    },
    onError: () => toast.error("Không thể cập nhật trạng thái sự kiện"),
  });
};

export const useRetryFailedEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => syncApi.retryFailedEvent(id),
    onSuccess: () => {
      toast.success("Đã gửi lại sự kiện");
      queryClient.invalidateQueries({ queryKey: syncKeys.failedEvents() });
    },
    onError: () => toast.error("Gửi lại sự kiện thất bại"),
  });
};

export const useRetryAllFailedEvents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncApi.retryAllFailedEvents(),
    onSuccess: () => {
      toast.success("Đã gửi lại tất cả sự kiện lỗi");
      queryClient.invalidateQueries({ queryKey: syncKeys.failedEvents() });
    },
    onError: () => toast.error("Gửi lại tất cả sự kiện thất bại"),
  });
};
