import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Search,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../lib/routes";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatDateTime, formatNumber } from "../../metrics-view/utils/format";
import type {
  SearchMode,
  SearchPostItem,
  SearchPostsParams,
  SearchProfileItem,
  SearchProfilesParams,
} from "../types";
import { useSearchPosts, useSearchProfiles } from "../queries";

const MIN_SEARCH_LENGTH = 2;
const PAGE_SIZE = 10;
const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=11";

const modeLabels: Record<SearchMode, string> = {
  posts: "Posts",
  profiles: "Profiles",
};

const getPostText = (post: SearchPostItem): string =>
  post.caption || post.title || "Untitled post";

const getAuthorName = (post: SearchPostItem): string =>
  post.authorInfo?.fullName || "Unknown author";

const getProfileAvatar = (profile: SearchProfileItem): string =>
  profile.avatar || profile.profilePicture || DEFAULT_AVATAR;

export function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mode, setMode] = useState<SearchMode>("posts");
  const [page, setPage] = useState(0);
  const debouncedKeyword = useDebouncedValue(keyword, 400);
  const searchTerm = (isSubmitted ? submittedKeyword : debouncedKeyword).trim();
  const canSearch = searchTerm.length >= MIN_SEARCH_LENGTH;

  const postParams = useMemo<SearchPostsParams>(
    () => ({
      searchTerm,
      page,
      size: PAGE_SIZE,
    }),
    [page, searchTerm],
  );

  const profileParams = useMemo<SearchProfilesParams>(
    () => ({
      searchTerm,
      page,
      size: PAGE_SIZE,
    }),
    [page, searchTerm],
  );

  const postsQuery = useSearchPosts(postParams, mode === "posts" && canSearch);
  const profilesQuery = useSearchProfiles(
    profileParams,
    mode === "profiles" && canSearch,
  );
  const activeQuery = mode === "posts" ? postsQuery : profilesQuery;
  const activePage = mode === "posts" ? postsQuery.data : profilesQuery.data;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSubmittedKeyword(keyword.trim());
    setIsSubmitted(true);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Search
        </h2>
        <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
          Search backend-indexed community posts and user profiles.
        </p>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col lg:flex-row lg:items-center gap-3"
        >
          <label className="sr-only" htmlFor="searchKeyword">
            Search keyword
          </label>
          <div className="flex-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#245A34] focus-within:ring-2 focus-within:ring-[#245A34]/15">
            <Search className="mr-3 h-5 w-5 text-slate-400" strokeWidth={2.5} />
            <input
              id="searchKeyword"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setIsSubmitted(false);
                setSubmittedKeyword("");
                setPage(0);
              }}
              placeholder="Enter at least 2 characters to search posts or profiles"
              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={keyword.trim().length < MIN_SEARCH_LENGTH}
            className="rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["posts", "profiles"] as SearchMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMode(option);
                setPage(0);
                setIsSubmitted(false);
                setSubmittedKeyword("");
              }}
              className={`rounded-full px-4 py-2 text-sm font-black transition-colors ${
                mode === option
                  ? "bg-[#245A34] text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-[#245A34]"
              }`}
            >
              {modeLabels[option]}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-slate-500">
          Press Enter to search immediately. Results update after a short
          debounce while typing.
        </p>
      </section>

      {!canSearch ? (
        <div className="rounded-[2rem] bg-white border border-slate-100 p-10 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-4 text-lg font-black text-slate-800">
            Enter a search keyword
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Use at least 2 characters to search backend posts or profiles.
          </p>
        </div>
      ) : null}

      {canSearch && activeQuery.isLoading ? (
        <div
          aria-label="Loading search results"
          className="rounded-[2rem] bg-white border border-slate-100 p-5 shadow-sm"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-20 rounded-2xl bg-slate-100 animate-pulse mb-3 last:mb-0"
            />
          ))}
        </div>
      ) : null}

      {canSearch && activeQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                Search results could not be loaded
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                The search service returned an error for the current query.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void activeQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {canSearch && activePage && !activeQuery.isError ? (
        <section className="rounded-[2rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div>
              <p className="text-sm font-black text-slate-800">
                {formatNumber(activePage.totalItems)} {modeLabels[mode].toLowerCase()} found
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Page {formatNumber(activePage.page + 1)} of{" "}
                {formatNumber(Math.max(activePage.totalPages, 1))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={!activePage.hasPrevious}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous search page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!activePage.hasNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next search page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          {activePage.items.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-black text-slate-800">
                No {modeLabels[mode].toLowerCase()} found
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Try a different keyword or switch search mode.
              </p>
            </div>
          ) : mode === "posts" ? (
            <PostResults posts={postsQuery.data?.items ?? []} />
          ) : (
            <ProfileResults profiles={profilesQuery.data?.items ?? []} />
          )}
        </section>
      ) : null}
    </div>
  );
}

function PostResults({ posts }: { posts: SearchPostItem[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`${ROUTES.DASHBOARD.COMMUNITY}?post=${encodeURIComponent(post.id)}`}
          className="block p-5 transition-colors hover:bg-slate-50"
        >
          <div className="flex items-start gap-4">
            <img
              src={post.authorInfo?.avatar || DEFAULT_AVATAR}
              alt={getAuthorName(post)}
              className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-slate-900">
                  {getAuthorName(post)}
                </p>
                {post.postType ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#245A34]">
                    {post.postType}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-700">
                {getPostText(post)}
              </p>
              {post.hashtags?.length ? (
                <p className="mt-2 text-xs font-bold text-[#245A34]">
                  {post.hashtags.join(" ")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                <span>{formatDateTime(post.uploadedAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {formatNumber(post.upvoteCount ?? 0)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {formatNumber(post.commentCount ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ProfileResults({ profiles }: { profiles: SearchProfileItem[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {profiles.map((profile) => (
        <article key={profile.id} className="p-5">
          <div className="flex items-start gap-4">
            <img
              src={getProfileAvatar(profile)}
              alt={profile.fullName || "Profile"}
              className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  {profile.fullName || "Unnamed profile"}
                </h3>
                {profile.role ? (
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                    {profile.role}
                  </span>
                ) : null}
                {profile.isVerified ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#245A34]">
                    Verified
                  </span>
                ) : null}
              </div>
              {profile.specialty ? (
                <p className="mt-1 text-sm font-bold text-[#245A34]">
                  {profile.specialty}
                </p>
              ) : null}
              {profile.bio ? (
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-600">
                  {profile.bio}
                </p>
              ) : null}
              {profile.addressLine ? (
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {profile.addressLine}
                </p>
              ) : null}
            </div>
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <UserRound className="h-5 w-5" strokeWidth={2.5} />
            </div>
          </div>
          <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
            Profile detail navigation is not available yet; this result is
            display-only.
          </p>
        </article>
      ))}
    </div>
  );
}

export default SearchPage;
