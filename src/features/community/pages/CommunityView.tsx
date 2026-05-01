import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { CreatePostArea } from '../components/CreatePostArea'
import { SuggestedExpertsWidget } from '../../profiles/components/SuggestedExpertsWidget'
import { PostCard } from '../components/PostCard'
import { useCommunityFeed } from '../queries'
import type { CommunityPageParams } from '../../../lib/api/communityApi'
import { formatNumber } from '../../metrics-view/utils/format'

export function CommunityView() {
  const [page, setPage] = useState(0)
  const size = 10

  const feedParams = useMemo<CommunityPageParams>(
    () => ({ page, size }),
    [page],
  )
  const feedQuery = useCommunityFeed(feedParams)
  const feed = feedQuery.data
  const posts = feed?.items ?? []

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
            <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-red-700">
                    Community feed could not be loaded
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-red-600">
                    The community service returned an error for this feed page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void feedQuery.refetch()}
                  className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {feed && !feedQuery.isError ? (
            <>
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="rounded-[2rem] bg-white border border-slate-100 p-10 text-center shadow-sm">
                    <h3 className="text-lg font-black text-slate-800">
                      No community posts
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      The backend returned an empty feed page.
                    </p>
                  </div>
                ) : (
                  posts.map(post => <PostCard key={post.id} post={post} />)
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
