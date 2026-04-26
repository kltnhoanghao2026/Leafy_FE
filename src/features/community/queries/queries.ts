import { useQuery } from "@tanstack/react-query";
import { communityApi, type CommunityPageParams } from "../../../lib/api/communityApi";
import {
  mapCommentResponseToComment,
  mapPostResponseToPost,
  normalizeCommunityPage,
} from "../mappers";
import { communityKeys } from "./keys";

export const useCommunityFeed = (
  params: CommunityPageParams,
  enabled = true,
) =>
  useQuery({
    queryKey: communityKeys.feed(params),
    queryFn: () => communityApi.getFeed(params),
    select: (page) => normalizeCommunityPage(page, mapPostResponseToPost),
    enabled,
  });

export const useCommunityComments = (
  postId: string,
  params: CommunityPageParams,
  enabled = true,
) =>
  useQuery({
    queryKey: communityKeys.comments(postId, params),
    queryFn: () => communityApi.getCommentsByPost(postId, params),
    select: (page) => normalizeCommunityPage(page, mapCommentResponseToComment),
    enabled: enabled && !!postId,
  });

export const useCommunityReplies = (
  commentId: string,
  params: CommunityPageParams,
  enabled = true,
) =>
  useQuery({
    queryKey: communityKeys.replies(commentId, params),
    queryFn: () => communityApi.getRepliesByComment(commentId, params),
    select: (page) => normalizeCommunityPage(page, mapCommentResponseToComment),
    enabled: enabled && !!commentId,
  });
