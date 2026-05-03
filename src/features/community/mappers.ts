import { formatDateTime } from "../metrics-view/utils/format";
import type {
  AuthorSummary,
  Comment,
  CommunityCommentResponse,
  CommunityPage,
  CommunityPostResponse,
  CommunityProfileSummary,
  CommunitySpringPage,
  Post,
  SharedPostSnapshot,
} from "./types";

const authorFromProfile = (
  authorId: string | null,
  profile: CommunityProfileSummary | null,
): AuthorSummary => ({
  id: profile?.id || authorId || "unknown",
  name: profile?.fullName || "Unknown author",
  avatar: profile?.avatar ?? null,
});

const textFromPost = (post: CommunityPostResponse): string =>
  post.content?.caption ||
  post.content?.description ||
  post.content?.title ||
  post.sharedCaption?.caption ||
  "";

const imagesFromPost = (post: CommunityPostResponse): string[] | undefined => {
  const images =
    post.media?.map((media) => media.url).filter((url): url is string => !!url) ??
    [];
  return images.length ? images : undefined;
};

const locationFromPost = (post: CommunityPostResponse): string | undefined =>
  post.location?.name || post.location?.address || undefined;

const hasUrgentHashtag = (post: CommunityPostResponse): boolean =>
  Boolean(
    post.content?.hashtags?.some((tag) =>
      tag.toLowerCase().includes("urgent"),
    ),
  );

export const mapPostToSharedSnapshot = (
  post: CommunityPostResponse,
): SharedPostSnapshot => ({
  id: post.id,
  author: authorFromProfile(post.authorId, post.authorInfo),
  timestamp: formatDateTime(post.uploadedAt || post.updatedAt),
  location: locationFromPost(post),
  content: textFromPost(post),
  images: imagesFromPost(post),
  isUrgent: hasUrgentHashtag(post),
  likes: post.stats?.upvoteCount ?? 0,
  upvotes: post.stats?.upvoteCount ?? 0,
  downvotes: post.stats?.downvoteCount ?? 0,
  comments: post.stats?.commentCount ?? 0,
  shares: post.stats?.shareCount ?? 0,
});

export const mapPostResponseToPost = (post: CommunityPostResponse): Post => ({
  id: post.id,
  author: authorFromProfile(post.authorId, post.authorInfo),
  timestamp: formatDateTime(post.uploadedAt || post.updatedAt),
  location: locationFromPost(post),
  content: textFromPost(post),
  images: imagesFromPost(post),
  isUrgent: hasUrgentHashtag(post),
  likes: post.stats?.upvoteCount ?? 0,
  upvotes: post.stats?.upvoteCount ?? 0,
  downvotes: post.stats?.downvoteCount ?? 0,
  currentUserVoteType: post.currentUserVoteType,
  isLikedByMe: post.currentUserVoteType === "UPVOTE",
  comments: post.stats?.commentCount ?? 0,
  commentsList: undefined,
  shares: post.stats?.shareCount ?? 0,
  sharedPost: post.sharedPostInfo
    ? mapPostToSharedSnapshot(post.sharedPostInfo)
    : undefined,
});

export const mapCommentResponseToComment = (
  comment: CommunityCommentResponse,
): Comment => ({
  id: comment.id,
  author: authorFromProfile(comment.authorId, comment.authorInfo),
  content: comment.content,
  timestamp: formatDateTime(comment.createdAt || comment.lastModifiedAt),
  likes: comment.upvoteCount ?? 0,
  downvotes: comment.downvoteCount ?? 0,
  currentUserVoteType: null,
  isLikedByMe: false,
  replyCount: comment.replyCount ?? 0,
  replies: undefined,
});

export const normalizeCommunityPage = <T, U>(
  page: CommunitySpringPage<T>,
  mapper: (item: T) => U,
): CommunityPage<U> => {
  const currentPage = page.number ?? 0;
  const totalPages = page.totalPages ?? 0;

  return {
    items: (page.content ?? []).map(mapper),
    page: currentPage,
    size: page.size ?? 0,
    totalItems: page.totalElements ?? page.content?.length ?? 0,
    totalPages,
    hasPrevious: currentPage > 0,
    hasNext: currentPage + 1 < totalPages,
  };
};
