import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  ApprovalRequestDto,
  CreateApprovalRequestPayload,
} from "../types";

/** Submit a batch of certificates for approval as expert */
export const certificatesApi = {
  /**
   * Submit a new certificate approval request for the given profile.
   * POST /profiles/{profileId}/approval-requests
   */
  submitApprovalRequest: (
    profileId: string,
    payload: CreateApprovalRequestPayload,
  ) =>
    apiClient.post<ApiEnvelope<ApprovalRequestDto>>(
      API_ENDPOINTS.PROFILES.APPROVAL_REQUESTS(profileId),
      payload,
    ),

  /**
   * Get all approval requests belonging to a specific profile.
   * GET /profiles/{profileId}/approval-requests
   * (owner view — returns their own history)
   */
  getMyApprovalRequests: (profileId: string) =>
    apiClient.get<ApiEnvelope<ApprovalRequestDto[]>>(
      API_ENDPOINTS.PROFILES.MY_APPROVAL_REQUESTS(profileId),
    ),
};
