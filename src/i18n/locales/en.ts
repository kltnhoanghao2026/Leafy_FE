import type { TranslationDict } from "../types";

/**
 * English locale.
 * Type-checked against the Vietnamese source-of-truth via TranslationDict.
 * Any key missing here will be a TypeScript error.
 */
import { settingsEn } from "../../features/settings/locales/en";

export const en: TranslationDict = {
  common: {
    loading: "Loading...",
    saving: "Saving...",
    retry: "Retry",
    error: "An error occurred",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    viewAll: "View all",
    noData: "No data",
    back: "Back",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    unknown: "Unknown",
  },

  auth: {
    login: "Sign in",
    register: "Sign up",
    logout: "Sign out",
    verifyEmail: "Verify email",
    email: "Email",
    password: "Password",
    phoneNumber: "Phone number",
    forgotPassword: "Forgot password?",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
  },

  nav: {
    dashboard: "Dashboard",
    community: "Community",
    search: "Search",
    chat: "Messages",
    profile: "Profile",
    settings: "Settings",
    experts: "Experts",
    alerts: "Alerts",
    plants: "Plants",
    devices: "Devices",
    admin: "Admin",
  },

  pageLoader: {
    loading: "Loading page...",
  },

  settings: settingsEn,

  chat: {
    emptyStateTitle: "Leafy Chat",
    emptyStateDescription:
      "Select a conversation from the list or start a new one to connect.",
    revokedMessage: "This message was revoked",
    deletedByAdmin: "This message was deleted by an admin",
    disbandedBanner: "🔒 This group has been disbanded. No new messages can be sent.",
    disbandedSubtitle: "🔒 Group disbanded",
    memberCount: (count: number) => `${count} member${count === 1 ? "" : "s"}`,
    dmSubtitle: "Message",
    groupInfo: "Group info",
    conversationInfo: "Conversation info",
    inputPlaceholder: "Type a message…",
    disbandedPlaceholder: "Group disbanded",
    sendFile: "Attach file",
    sendImage: "Send image / video",
    edited: "edited",
    unknownUser: "User",
    attachment: "[Attachment]",
    noConversation: "No conversations yet",
    newConversation: "New conversation",
    searchConversations: "Search conversations...",
  },

  community: {
    feed: "Feed",
    createPost: "What's on your mind?",
    noPostsYet: "No posts yet.",
    suggestedExperts: "Suggested experts",
    comment: "Comment",
    like: "Like",
    share: "Share",
    viewAllComments: "View all comments",
  },

  profile: {
    myProfile: "My profile",
    editProfile: "Edit profile",
    followers: "Followers",
    following: "Following",
    posts: "Posts",
    follow: "Follow",
    unfollow: "Unfollow",
    verified: "Verified",
    role: {
      FARMER: "Farmer",
      EXPERT: "Expert",
    },
  },
};
