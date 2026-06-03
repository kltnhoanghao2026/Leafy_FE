export type SearchMode = "posts" | "profiles" | "plans";
export type SearchSortDirection = "ASC" | "DESC";

export interface SearchAuthorInfo {
  id: string | null;
  fullName: string | null;
  avatar: string | null;
  role: string | null;
  isVerified: boolean | null;
}

export interface SearchPostItem {
  id: string;
  authorId: string | null;
  authorInfo: SearchAuthorInfo | null;
  title: string | null;
  caption: string | null;
  hashtags: string[] | null;
  postType: string | null;
  upvoteCount: number | null;
  commentCount: number | null;
  uploadedAt: string | null;
  current: boolean | null;
}

export interface SearchProfileItem {
  id: string;
  userId: string | null;
  fullName: string | null;
  profilePicture: string | null;
  avatar: string | null;
  role: string | null;
  specialty: string | null;
  isVerified: boolean | null;
  bio: string | null;
  addressLine: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SearchPlanItem {
  id: string;
  creatorId: string | null;
  ownerId: string | null;
  planName: string | null;
  diseaseName: string | null;
  confidenceScore: number | null;
  severityLevel: string | null;
  urgency: string | null;
  requiredInputs: string[] | null;
  safetyWarnings: string[] | null;
  successIndicators: string | null;
  estimatedCost: string | null;
  source: string | null;
  isPublic: boolean | null;
  sourceType: string | null;
  eventCount: number | null;
  applyCount: number | null;
  creatorInfo: SearchAuthorInfo | null;
  createdAt: string | null;
}

export interface SearchSpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
}

export interface SearchPage<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchPostsParams {
  searchTerm: string;
  postType?: string;
  authorId?: string;
  page?: number;
  size?: number;
  /** Posts index uses `uploadedAt` for time sorting. */
  sortBy?: "uploadedAt" | "id" | "title" | "authorName";
  sortDir?: SearchSortDirection;
}

export interface SearchProfilesParams {
  searchTerm: string;
  role?: string;
  isVerified?: boolean;
  specialty?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: SearchSortDirection;
}

export interface SearchPlansParams {
  searchTerm: string;
  severityLevel?: string;
  urgency?: string;
  isPublic?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: SearchSortDirection;
}

export interface UnifiedSearchParams {
  searchTerm: string;
  postSize?: number;
  profileSize?: number;
  planSize?: number;
}

export interface UnifiedSearchResult {
  searchTerm: string;
  posts: SearchPostItem[];
  profiles: SearchProfileItem[];
  plans: SearchPlanItem[];
  totalPosts: number;
  totalProfiles: number;
  totalPlans: number;
  postSize: number;
  profileSize: number;
  planSize: number;
}
