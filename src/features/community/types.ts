export type CommunityPostType = "FEED" | "GENERAL" | "QUESTION" | "PLAN_SHARE";
export type CommunityVisibility = "FOLLOWER" | "ALL" | "ONLY_ME";
export type CommunityVoteType = "UPVOTE" | "DOWNVOTE";
export type CommunityVoteTargetType = "POST" | "COMMENT";
export type CommunityTreatmentStatus = "PENDING" | "APPLYING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

/** Embedded plan snapshot returned by the backend on PLAN_SHARE posts */
export interface CommunityPlanInfo {
  id: string;
  planName: string | null;
  diseaseName: string | null;
  severityLevel: string | null;
  urgency: string | null;
  status: CommunityTreatmentStatus;
  estimatedCost: string | null;
  confidenceScore: number | null;
  requiredInputs: string[] | null;
  safetyWarnings: string[] | null;
  successIndicators: string | null;
  applyCount: number | null;
  eventCount?: number | null;
  isPublic: boolean;
  createdAt: string | null;
}

export interface AuthorSummary {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface Comment {
  id: string;
  author: AuthorSummary;
  content: string;
  timestamp: string;
  likes: number;
  downvotes?: number;
  currentUserVoteType?: CommunityVoteType | null;
  isLikedByMe?: boolean;
  replyCount?: number;
  replies?: Comment[];
}

export interface Post {
  id: string;
  author: AuthorSummary;
  timestamp: string;
  location?: string;
  /** Flat combined text (caption || description || title) — for backward compat */
  content: string;
  /** Original title from post content */
  title?: string | null;
  /** Hashtag list from post content */
  hashtags?: string[] | null;
  /** Post type — FEED, SHARE, or PLAN_SHARE */
  postType: CommunityPostType;
  images?: string[];
  isUrgent?: boolean;
  likes: number;
  upvotes: number;
  downvotes: number;
  currentUserVoteType: CommunityVoteType | null;
  isLikedByMe?: boolean;
  comments: number;
  commentsList?: Comment[];
  shares: number;
  sharedPost?: SharedPostSnapshot;
  /** ID of a treatment plan attached to this post (PLAN_SHARE posts) */
  planId?: string | null;
  /** Embedded plan snapshot — present when the backend hydrates it */
  planInfo?: CommunityPlanInfo | null;
  /** Visibility setting — ALL, FOLLOWER, or ONLY_ME */
  visibility?: CommunityVisibility;
}

export interface SharedPostSnapshot {
  id: string;
  author: AuthorSummary;
  timestamp: string;
  location?: string;
  content: string;
  title?: string | null;
  hashtags?: string[] | null;
  images?: string[];
  isUrgent?: boolean;
  likes: number;
  upvotes?: number;
  downvotes?: number;
  comments: number;
  shares: number;
  commentsList?: Comment[];
}

export interface CommunityProfileSummary {
  id: string;
  fullName: string | null;
  avatar: string | null;
  role: string | null;
  isVerified: boolean | null;
  lastSyncedAt: string | null;
}

export interface CommunityPostContent {
  title?: string | null;
  caption?: string | null;
  description?: string | null;
  hashtags?: string[] | null;
}

export interface CommunityPostMedia {
  url: string | null;
  type: string | null;
}

export interface CommunityLocationInfo {
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CommunityPostStats {
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  shareCount: number;
}

export interface CommunityPostResponse {
  id: string;
  authorId: string | null;
  authorInfo: CommunityProfileSummary | null;
  groupId: string | null;
  content: CommunityPostContent | null;
  media: CommunityPostMedia[] | null;
  postType: CommunityPostType;
  sharedPostId: string | null;
  originalAuthorId: string | null;
  sharedCaption: CommunityPostContent | null;
  sharedPostInfo: CommunityPostResponse | null;
  rootPostId: string | null;
  location: CommunityLocationInfo | null;
  visibility: CommunityVisibility;
  /** ID of the treatment plan attached to this post (PLAN_SHARE posts only) */
  planId: string | null;
  /** Embedded plan snapshot hydrated by the backend on PLAN_SHARE posts */
  planInfo: CommunityPlanInfo | null;
  stats: CommunityPostStats | null;
  currentUserVoteType: CommunityVoteType | null;
  uploadedAt: string | null;
  updatedAt: string | null;
  edited?: boolean;
  isEdited?: boolean;
}

export interface CommunityCommentResponse {
  id: string;
  postId: string;
  authorId: string | null;
  authorInfo: CommunityProfileSummary | null;
  parentId: string | null;
  content: string;
  media: CommunityPostMedia[] | null;
  replyDepth: number;
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  /** The authenticated caller's current vote — null if they haven't voted */
  currentUserVoteType: CommunityVoteType | null;
  edited?: boolean;
  isEdited?: boolean;
  active: boolean;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

export interface CommunitySpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
}

export interface CommunityPage<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateCommunityPostRequest {
  groupId?: string | null;
  content: CommunityPostContent;
  media?: CommunityPostMedia[];
  postType: CommunityPostType;
  sharedPostId?: string | null;
  originalAuthorId?: string | null;
  sharedCaption?: CommunityPostContent | null;
  rootPostId?: string | null;
  location?: CommunityLocationInfo | null;
  visibility: CommunityVisibility;
  /** ID of a treatment plan to attach. Required when postType is PLAN_SHARE. */
  planId?: string | null;
}

export interface CreateCommunityCommentRequest {
  postId: string;
  parentId?: string | null;
  content: string;
  media?: CommunityPostMedia[];
}

export interface VoteCommunityRequest {
  targetType: CommunityVoteTargetType;
  targetId: string;
  type: CommunityVoteType;
}

export interface CommunityVoteAuthorInfo {
  id: string
  fullName: string | null
  avatar: string | null
  role: string | null
  isVerified: boolean | null
}

export interface CommunityVoteResponse {
  id: string
  voteId?: string         // alias kept for backward compat with APP shape
  type: CommunityVoteType
  authorId: string
  authorInfo: CommunityVoteAuthorInfo | null
  targetId: string
  targetType: string
  active: boolean
  createdAt: string | null
  lastModifiedAt: string | null
}

export interface HotTopic {
  id: string
  tag: string
  title: string
  engagementText: string
}

export interface OnlineExpert {
  id: string
  name: string
  avatar: string
  specialty: string
  isOnline: boolean
}
