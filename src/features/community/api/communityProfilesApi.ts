import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";

export interface ProfileResponse {
  id: string;
  userId: string;
  fullName: string;
  profilePicture: string;
  avatar: string;
  role: string;
  specialty: string;
  isVerified: boolean;
  active: boolean;
  bio: string;
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

export const communityProfilesApi = {
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
      API_ENDPOINTS.SEARCH.PROFILES,
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
    
  followUser: (followingId: string) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/users/${followingId}/follow`),

  unfollowUser: (followingId: string) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/users/${followingId}/unfollow`),
    
  requestConsultation: (expertId: string) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/experts/${expertId}/consult/request`),

  getPendingConsultations: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<ConsultationRequestResponse>>>(`/profiles/experts/consult/pending`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),

  respondToConsultation: (farmerId: string, accept: boolean) =>
    apiClient.post<ApiEnvelope<any>>(`/profiles/experts/consult/respond`, null, {
      params: { farmerId, accept },
    }),
};
