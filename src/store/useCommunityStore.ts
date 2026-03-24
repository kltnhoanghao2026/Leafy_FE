import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Post, Comment, HotTopic, OnlineExpert } from '../features/community/types'
import { MOCK_POSTS, MOCK_HOT_TOPICS, MOCK_EXPERTS } from '../features/community/mockCommunityData'

interface CommunityState {
  posts: Post[]
  hotTopics: HotTopic[]
  experts: OnlineExpert[]
  
  // Actions
  likePost: (postId: string) => void
  addPost: (post: Post) => void
  addComment: (postId: string, comment: Comment) => void
  likeComment: (postId: string, commentId: string) => void
  addReply: (postId: string, commentId: string, reply: Comment) => void
  incrementShares: (postId: string) => void
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set) => ({
      // Initialize with mock data
      posts: MOCK_POSTS,
      hotTopics: MOCK_HOT_TOPICS,
      experts: MOCK_EXPERTS,

      likePost: (postId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId) {
            const isLiked = !post.isLikedByMe
            return {
              ...post,
              isLikedByMe: isLiked,
              likes: isLiked ? post.likes + 1 : post.likes - 1
            }
          }
          return post
        })
      })),

      addPost: (post) => set((state) => ({
        posts: [post, ...state.posts]
      })),

      incrementShares: (postId) => set((state) => ({
        posts: state.posts.map(post =>
          post.id === postId ? { ...post, shares: post.shares + 1 } : post
        )
      })),

      addComment: (postId, comment) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId) {
            const currentList = post.commentsList || []
            return {
              ...post,
              comments: post.comments + 1, // update quick count
              commentsList: [...currentList, comment]
            }
          }
          return post
        })
      })),

      likeComment: (postId, commentId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId && post.commentsList) {
            return {
              ...post,
              commentsList: post.commentsList.map(c => {
                if (c.id === commentId) {
                  const isLiked = !c.isLikedByMe
                  return {
                    ...c,
                    isLikedByMe: isLiked,
                    likes: isLiked ? c.likes + 1 : c.likes - 1
                  }
                }
                return c
              })
            }
          }
          return post
        })
      })),

      addReply: (postId, commentId, reply) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId && post.commentsList) {
            return {
              ...post,
              comments: post.comments + 1, // consider a reply as a comment for top level count
              commentsList: post.commentsList.map(c => {
                if (c.id === commentId) {
                  const currentReplies = c.replies || []
                  return {
                    ...c,
                    replies: [...currentReplies, reply]
                  }
                }
                return c
              })
            }
          }
          return post
        })
      }))

    }),
    {
      name: 'community-storage'
    }
  )
)
