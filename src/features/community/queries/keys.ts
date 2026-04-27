import type { CommunityPageParams } from "../../../lib/api/communityApi";

export const communityKeys = {
  all: () => ["community"] as const,
  feedRoot: () => [...communityKeys.all(), "feed"] as const,
  feed: (params: CommunityPageParams) =>
    [...communityKeys.feedRoot(), params] as const,
  post: (postId: string) => [...communityKeys.all(), "post", postId] as const,
  commentsRoot: () => [...communityKeys.all(), "comments"] as const,
  comments: (postId: string, params: CommunityPageParams) =>
    [...communityKeys.commentsRoot(), postId, params] as const,
  repliesRoot: () => [...communityKeys.all(), "replies"] as const,
  replies: (commentId: string, params: CommunityPageParams) =>
    [...communityKeys.repliesRoot(), commentId, params] as const,
};
