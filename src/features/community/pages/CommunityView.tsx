import { CreatePostArea } from '../components/CreatePostArea'
import { HotTopicsWidget } from '../components/HotTopicsWidget'
import { OnlineExpertsWidget } from '../../profiles/components/OnlineExpertsWidget'
import { PostCard } from '../components/PostCard'
import { useCommunityStore } from '../../../store/useCommunityStore'

export function CommunityView() {
  const posts = useCommunityStore(state => state.posts)
  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Center Feed Column */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Create Post Area (Phase 2) */}
          <CreatePostArea />
          
          {/* Feed Container (Phase 3) */}
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="flex flex-col gap-6 xl:col-span-4">
          <HotTopicsWidget />
          <OnlineExpertsWidget />
        </div>
        
      </div>
    </div>
  )
}

export default CommunityView
