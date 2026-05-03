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

export interface SpringPage<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: any;
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
    apiClient.post<ApiEnvelope<any>>(`/profiles/users/${followingId}/follow`),

  unfollowUser: (followingId: string) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/users/${followingId}/unfollow`),

  requestConsultation: (expertId: string) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/experts/${expertId}/consult/request`),

  cancelConsultation: (expertId: string) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/experts/${expertId}/consult/cancel`),

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

  respondToConsultation: (farmerId: string, accept: boolean) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/experts/consult/respond`, null, {
      params: { farmerId, accept },
    }),

  getFollowersProfiles: (userId: string, params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ProfileResponse>>>(`/profiles/users/${userId}/followers/profiles`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),
};
