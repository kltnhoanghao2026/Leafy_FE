import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityApi } from "../../../lib/api/communityApi";
import type {
  CommunityVoteType,
  CreateCommunityCommentRequest,
  CreateCommunityPostRequest,
} from "../types";
import { communityKeys } from "./keys";

export const useCreateCommunityPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommunityPostRequest) =>
      communityApi.createPost(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityKeys.feedRoot(),
      });
    },
    meta: {
      successMessage: "Post created.",
    },
  });
};

export const useCreateCommunityComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommunityCommentRequest) =>
      communityApi.createComment(payload),
    onSuccess: async (_response, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: communityKeys.feedRoot() }),
        queryClient.invalidateQueries({
          queryKey: communityKeys.commentsRoot(),
        }),
        payload.parentId
          ? queryClient.invalidateQueries({
              queryKey: communityKeys.repliesRoot(),
            })
          : Promise.resolve(),
      ]);
    },
    meta: {
      successMessage: "Comment posted.",
    },
  });
};

export const useVotePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { postId: string; type: CommunityVoteType }) =>
      communityApi.vote({
        targetType: "POST",
        targetId: payload.postId,
        type: payload.type,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityKeys.feedRoot(),
      });
    },
    meta: {
      successMessage: "Post vote updated.",
    },
  });
};

export const useVoteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { commentId: string; type: CommunityVoteType }) =>
      communityApi.vote({
        targetType: "COMMENT",
        targetId: payload.commentId,
        type: payload.type,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: communityKeys.commentsRoot(),
        }),
        queryClient.invalidateQueries({
          queryKey: communityKeys.repliesRoot(),
        }),
      ]);
    },
    meta: {
      successMessage: "Comment vote updated.",
    },
  });
};
