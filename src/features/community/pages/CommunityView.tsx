import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CreatePostArea } from '../components/CreatePostArea'
import { SuggestedExpertsWidget } from '../../profiles/components/SuggestedExpertsWidget'
import { PostCard } from '../components/PostCard'
import { useCommunityFeed } from '../queries'
import { communityApi } from '../../../lib/api/communityApi'
import type { CommunityPageParams } from '../../../lib/api/communityApi'
import { formatNumber } from '../../metrics-view/utils/format'
import { PageErrorState } from '../../../components/ui/PageErrorState'

export function CommunityView() {
  const [page, setPage] = useState(0)
  const size = 10

  // Track which posts have been reported as viewed (to prevent duplicate calls)
  const reportedViewedRef = useRef<Set<string>>(new Set())

  const feedParams = useMemo<CommunityPageParams>(
    () => ({ page, size }),
    [page],
  )
  const feedQuery = useCommunityFeed(feedParams)
  const feed = feedQuery.data
  const posts = feed?.items ?? []

  // Callback when a post becomes visible - sends per-post view tracking
  const handlePostViewed = useCallback((postId: string) => {
    if (reportedViewedRef.current.has(postId)) return
    reportedViewedRef.current.add(postId)
    communityApi.markPostViewed(postId).catch((err) => {
      console.error('Failed to mark post as viewed:', err)
      // Allow retry on failure by removing from reported set
      reportedViewedRef.current.delete(postId)
    })
  }, [])

  // Clear reported views when page changes (new posts loaded)
  useEffect(() => {
    reportedViewedRef.current.clear()
  }, [page])

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Center Feed Column */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <CreatePostArea />
          
          {feedQuery.isLoading ? (
            <div
              aria-label="Loading community feed"
              className="rounded-[2rem] bg-white border border-slate-100 p-5 shadow-sm"
            >
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-slate-100 animate-pulse mb-3 last:mb-0"
                />
              ))}
            </div>
          ) : null}

          {feedQuery.isError ? (
            <PageErrorState
              title="Community feed could not be loaded"
              description="The community service returned an error for this feed page."
              onRetry={() => void feedQuery.refetch()}
            />
          ) : null}

          {feed && !feedQuery.isError ? (
            <>
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="rounded-[2rem] bg-white border border-slate-100 p-10 text-center shadow-sm">
                    <h3 className="text-lg font-black text-slate-800">
                      No new content
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Follow more people or experts to see their posts.
                    </p>
                  </div>
                ) : (
                  posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onView={handlePostViewed}
                    />
                  ))
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[2rem] bg-white border border-slate-100 p-4 shadow-sm">
                <div>
                  <p className="text-sm font-black text-slate-800">
                    {formatNumber(feed.totalItems)} community posts
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Page {formatNumber(feed.page + 1)} of{' '}
                    {formatNumber(Math.max(feed.totalPages, 1))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                    disabled={!feed.hasPrevious}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous community page"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={!feed.hasNext}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next community page"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="flex flex-col gap-6 xl:col-span-4 sticky top-6 self-start">
          <SuggestedExpertsWidget />
        </div>
        
      </div>
    </div>
  )
}

export default CommunityView
