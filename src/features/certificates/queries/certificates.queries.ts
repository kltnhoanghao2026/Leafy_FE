import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificatesApi } from "../api/certificates.api";
import type {
  ApprovalRequestDto,
  CreateApprovalRequestPayload,
} from "../types";

export const certificateKeys = {
  all: ["certificates"] as const,
  myRequests: (profileId: string) =>
    ["certificates", "my-requests", profileId] as const,
};

export const certificatesQueries = {
  /** Fetch the current user's own approval request history */
  useMyApprovalRequests: (profileId: string) =>
    useQuery({
      queryKey: certificateKeys.myRequests(profileId),
      queryFn: () => certificatesApi.getMyApprovalRequests(profileId),
      select: (res) => res.data.data ?? [],
      enabled: !!profileId,
    }),
};

export const certificatesMutations = {
  /** Submit a new certificate batch for approval */
  useSubmitApprovalRequest: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({
        profileId,
        payload,
      }: {
        profileId: string;
        payload: CreateApprovalRequestPayload;
      }) => certificatesApi.submitApprovalRequest(profileId, payload),
      onSuccess: (_data, variables) => {
        qc.invalidateQueries({
          queryKey: certificateKeys.myRequests(variables.profileId),
        });
      },
    });
  },
};
