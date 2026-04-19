export type SearchMode = "posts" | "profiles";
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
  sortBy?: string;
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
