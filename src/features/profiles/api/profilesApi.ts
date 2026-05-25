import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type { CommunityPostResponse, CommunitySpringPage } from "../../community/types";

export interface ProfileResponse {
  id: string;
  userId: string;
  fullName: string;
  profilePicture: string;
  avatar: string;
  role: string;
  specialty: string;
  certificates: CertificateDto[];
  isVerified: boolean;
  active: boolean;
  bio: string;
  addressLine: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  email: string | null;
  phoneNumber: string | null;
  createdAt: string | null;
  isFollowing?: boolean;
  hasPendingConsultRequest?: boolean;
}

export interface CertificateDto {
  id: string;
  title: string;
  issuedBy: string;
  proofUrl: string;
  proofFileId?: string;
  fileType?: string;
  issueDate: string;
  expired: boolean;
}

export interface springPageSort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface springPagePageable {
  pageNumber: number;
  pageSize: number;
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface SpringPage<T> {
  content: T[];
  pageable: springPagePageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: springPageSort;
  numberOfElements: number;
  empty: boolean;
}

export interface ConsultationRequestResponse {
  connectionId: string;
  followerId: string;
  followerName: string;
  followerAvatar: string;
  followerRole: string;
  requestedAt: string;
  status: string;
}

export interface UserConnectionResponse {
  id: string;
  followerId: string;
  followingId: string;
  isFollowing: boolean;
  consultationStatus: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string | null;
  updatedAt: string | null;
}

export type ConsultingDataType = "FARM_PLOTS" | "PLANTS" | "PLANT_EVENTS" | "PLANS";

export type AccessRequestStatus = "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";

export interface ConsultingDataAccessRequestResponse {
  id: string;
  expertProfileId: string;
  expertName: string | null;
  expertAvatar: string | null;
  farmerProfileId: string;
  dataType: ConsultingDataType;
  status: AccessRequestStatus;
  expertMessage: string | null;
  requestedAt: string | null;
  respondedAt: string | null;
}

export const profilesApi = {
  getPublicExperts: (params: { page?: number; size?: number; searchTerm?: string } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ProfileResponse>>>(
      API_ENDPOINTS.PROFILES.PUBLIC_EXPERTS,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          ...(params.searchTerm ? { searchTerm: params.searchTerm } : {}),
        },
      }
    ),

  searchExpertsES: (params: { page?: number; size?: number; searchTerm?: string; specialty?: string } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ProfileResponse>>>(
      API_ENDPOINTS.PROFILES.SEARCH_EXPERTS,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 50,
          searchTerm: params.searchTerm ?? "",
          role: "EXPERT",
          isVerified: true,
          ...(params.specialty && params.specialty !== "all" ? { specialty: params.specialty } : {}),
        },
      }
    ),

  /** Fetch any user's public profile (enriched with isFollowing / hasPendingConsultRequest) */
  getPublicProfile: (profileId: string) =>
    apiClient.get<ApiEnvelope<ProfileResponse>>(API_ENDPOINTS.PROFILES.PUBLIC(profileId)),

  /** Fetch recent posts by a given userId */
  getPostsByUserId: (userId: string, params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<CommunitySpringPage<CommunityPostResponse>>>(
      API_ENDPOINTS.COMMUNITY.POSTS_BY_USER(userId),
      { params: { page: params.page ?? 0, size: params.size ?? 10 } }
    ),

  followUser: (followingId: string) =>
    apiClient.post<ApiEnvelope<UserConnectionResponse>>(`/profiles/users/${followingId}/follow`),

  unfollowUser: (followingId: string) =>
    apiClient.post<ApiEnvelope<void>>(`/profiles/users/${followingId}/unfollow`),

  requestConsultation: (expertId: string) =>
    apiClient.post<ApiEnvelope<UserConnectionResponse>>(`/profiles/experts/${expertId}/consult/request`),

  cancelConsultation: (expertId: string) =>
    apiClient.post<ApiEnvelope<void>>(`/profiles/experts/${expertId}/consult/cancel`),

  getPendingConsultations: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ConsultationRequestResponse>>>(`/profiles/experts/consult/pending`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),

  getAcceptedConsultations: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ConsultationRequestResponse>>>(`/profiles/experts/consult/accepted`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),

  respondToConsultation: (farmerProfileId: string, accept: boolean) =>
    apiClient.post<ApiEnvelope<UserConnectionResponse>>(`/profiles/experts/consult/respond`, null, {
      params: { farmerProfileId, accept },
    }),

  getFollowersProfiles: (userId: string, params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ProfileResponse>>>(`/profiles/users/${userId}/followers/profiles`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),

  getFollowingProfiles: (userId: string, params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ProfileResponse>>>(`/profiles/users/${userId}/following/profiles`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),

  requestDataAccess: (
    farmerProfileId: string,
    dataType: ConsultingDataType,
    message?: string,
  ) =>
    apiClient.post<ApiEnvelope<ConsultingDataAccessRequestResponse>>(
      `/profiles/consulting/access/request`,
      message ? { message } : undefined,
      { params: { farmerProfileId, dataType } },
    ),

  getPendingAccessRequests: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ConsultingDataAccessRequestResponse>>>(
      `/profiles/consulting/access/requests/pending`,
      { params: { page: params.page ?? 0, size: params.size ?? 20 } },
    ),

  approveAccessRequest: (requestId: string) =>
    apiClient.post<ApiEnvelope<ConsultingDataAccessRequestResponse>>(
      `/profiles/consulting/access/requests/${requestId}/approve`,
    ),

  denyAccessRequest: (requestId: string) =>
    apiClient.post<ApiEnvelope<ConsultingDataAccessRequestResponse>>(
      `/profiles/consulting/access/requests/${requestId}/deny`,
    ),
};
