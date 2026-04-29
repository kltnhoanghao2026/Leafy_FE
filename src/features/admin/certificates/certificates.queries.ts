import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificatesApi } from "./certificates.api";
import { certificateKeys } from "./certificateKeys";
import type { UpdateApprovalStatusPayload } from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const useAdminPendingApprovalRequests = () =>
  useQuery({
    queryKey: certificateKeys.pending(),
    queryFn: () => certificatesApi.getPendingApprovalRequests(),
    select: (response) => response.data.data,
    staleTime: 30_000,
  });

export const useAdminProcessedApprovalRequests = () =>
  useQuery({
    queryKey: certificateKeys.processed(),
    queryFn: () => certificatesApi.getProcessedApprovalRequests(),
    select: (response) => response.data.data,
    staleTime: 30_000,
  });

interface UpdateStatusVariables {
  profileId: string;
  requestId: string;
  payload: UpdateApprovalStatusPayload;
}

export const useUpdateApprovalStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, requestId, payload }: UpdateStatusVariables) =>
      certificatesApi.updateApprovalStatus(profileId, requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.pending() });
      queryClient.invalidateQueries({ queryKey: certificateKeys.processed() });
    },
  });
};

interface RevokeVariables {
  profileId: string;
  requestId: string;
  reason?: string;
}

export const useRevokeApprovalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, requestId, reason }: RevokeVariables) =>
      certificatesApi.revokeApprovalRequest(profileId, requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.pending() });
      queryClient.invalidateQueries({ queryKey: certificateKeys.processed() });
    },
  });
};

export const usePresignedUrl = (fileId: string | undefined) =>
  useQuery<string>({
    queryKey: ["files", "presigned-url", fileId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: string }>(
        API_ENDPOINTS.FILES.PRESIGNED_URL(fileId!),
      );
      return res.data.data;
    },
    enabled: !!fileId,
    staleTime: 4 * 60 * 1000, // presigned URLs typically expire in 5-15 min; refresh every 4 min
    gcTime: 5 * 60 * 1000,
  });
