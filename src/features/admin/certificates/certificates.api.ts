import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  ApprovalRequestDto,
  ApprovalRequestResponse,
  UpdateApprovalStatusPayload,
} from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const certificatesApi = {
  getPendingApprovalRequests: () =>
    apiClient.get<ApiEnvelope<ApprovalRequestResponse[]>>(
      API_ENDPOINTS.PROFILES.PENDING_APPROVAL_REQUESTS,
    ),

  getProcessedApprovalRequests: () =>
    apiClient.get<ApiEnvelope<ApprovalRequestResponse[]>>(
      API_ENDPOINTS.PROFILES.PROCESSED_APPROVAL_REQUESTS,
    ),

  updateApprovalStatus: (
    profileId: string,
    requestId: string,
    payload: UpdateApprovalStatusPayload,
  ) =>
    apiClient.patch<ApiEnvelope<unknown>>(
      API_ENDPOINTS.PROFILES.UPDATE_APPROVAL_STATUS(profileId, requestId),
      payload,
    ),

  revokeApprovalRequest: (
    profileId: string,
    requestId: string,
    reason?: string,
  ) =>
    apiClient.patch<ApiEnvelope<unknown>>(
      API_ENDPOINTS.PROFILES.REVOKE_APPROVAL(profileId, requestId),
      reason ? { reason } : undefined,
    ),
};
