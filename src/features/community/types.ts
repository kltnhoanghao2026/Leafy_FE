export interface Comment {
  id: string
  author: {
    id: string
    name: string
    avatar: string
  }
  content: string
  timestamp: string
  likes: number
  isLikedByMe?: boolean
  replies?: Comment[]
}

export interface Post {
  id: string
  author: {
    id: string
    name: string
    avatar: string
  }
  timestamp: string
  location?: string
  content: string
  images?: string[]
  isUrgent?: boolean
  likes: number
  isLikedByMe?: boolean
  comments: number // total count for quick display
  commentsList?: Comment[]
  shares: number
  sharedPost?: SharedPostSnapshot // embedded original post when resharing
}

// A lightweight read-only snapshot of the original post to embed inside a share
export interface SharedPostSnapshot {
  id: string
  author: {
    id: string
    name: string
    avatar: string
  }
  timestamp: string
  location?: string
  content: string
  images?: string[]
  isUrgent?: boolean
  likes: number
  comments: number
  shares: number
  commentsList?: Comment[]
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
