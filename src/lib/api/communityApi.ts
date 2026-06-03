import apiClient from "../apiClient";
import { API_ENDPOINTS } from "../routes";
import type { ApiEnvelope } from "../../shared/types/api";
import type {
  CommunityCommentResponse,
  CommunityPostResponse,
  CommunitySpringPage,
  CommunityVoteResponse,
  CreateCommunityCommentRequest,
  CreateCommunityPostRequest,
  VoteCommunityRequest,
} from "../../features/community/types";

const unwrapApiData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    ("code" in payload || "message" in payload)
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

export interface CommunityPageParams {
  page?: number;
  size?: number;
}

export const communityApi = {
  getFeed: async (params: CommunityPageParams = {}) => {
    const response = await apiClient.get<
      ApiEnvelope<CommunitySpringPage<CommunityPostResponse>> | CommunitySpringPage<CommunityPostResponse>
    >(API_ENDPOINTS.COMMUNITY.FEED_POSTS, { params });
    return unwrapApiData(response.data);
  },

  getPost: async (postId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<CommunityPostResponse> | CommunityPostResponse
    >(API_ENDPOINTS.COMMUNITY.POST_BY_ID(postId));
    return unwrapApiData(response.data);
  },

  createPost: async (payload: CreateCommunityPostRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<CommunityPostResponse> | CommunityPostResponse
    >(API_ENDPOINTS.COMMUNITY.CREATE_POST, payload);
    return unwrapApiData(response.data);
  },

  getCommentsByPost: async (
    postId: string,
    params: CommunityPageParams = {},
  ) => {
    const response = await apiClient.get<
      ApiEnvelope<CommunitySpringPage<CommunityCommentResponse>> | CommunitySpringPage<CommunityCommentResponse>
    >(API_ENDPOINTS.COMMUNITY.COMMENTS_BY_POST(postId), { params });
    return unwrapApiData(response.data);
  },

  getRepliesByComment: async (
    commentId: string,
    params: CommunityPageParams = {},
  ) => {
    const response = await apiClient.get<
      ApiEnvelope<CommunitySpringPage<CommunityCommentResponse>> | CommunitySpringPage<CommunityCommentResponse>
    >(API_ENDPOINTS.COMMUNITY.REPLIES_BY_COMMENT(commentId), { params });
    return unwrapApiData(response.data);
  },

  createComment: async (payload: CreateCommunityCommentRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<CommunityCommentResponse> | CommunityCommentResponse
    >(API_ENDPOINTS.COMMUNITY.CREATE_COMMENT, payload);
    return unwrapApiData(response.data);
  },

  vote: async ({ targetType, targetId, type }: VoteCommunityRequest) => {
    const response = await apiClient.post<ApiEnvelope<void> | void>(
      API_ENDPOINTS.COMMUNITY.VOTE(targetType, targetId),
      null,
      { params: { type } },
    );
    return response.data ? unwrapApiData(response.data) : undefined;
  },

  getVotesByPost: async (
    postId: string,
    type: "UPVOTE" | "DOWNVOTE",
    params: CommunityPageParams = {},
  ) => {
    const response = await apiClient.get<
      ApiEnvelope<CommunitySpringPage<CommunityVoteResponse>> | CommunitySpringPage<CommunityVoteResponse>
    >(API_ENDPOINTS.COMMUNITY.VOTES_BY_POST(postId), { params: { type, ...params } });
    return unwrapApiData(response.data);
  },

  markPostViewed: async (postId: string) => {
    const response = await apiClient.post<ApiEnvelope<void> | void>(
      API_ENDPOINTS.FEED.MARK_POST_VIEWED(postId),
    );
    return response.data ? unwrapApiData(response.data) : undefined;
  },
};
