import { settingsVi } from "./vi";

export const settingsEn: typeof settingsVi = {
  title: "System Settings",
  subtitle: "Manage your account and customize your experience.",
  copyright: "© 2024 Coffee Monitor Vietnam. All rights reserved.",

  tabs: {
    account: "Account",
    display: "Display",
    privacy: "Privacy",
    notifications: "Notifications",
    messaging: "Messaging & Other",
  },

  display: {
    title: "Display & Language",
    theme: "Theme",
    themeDescription: "Saved in your profile and applied across the app.",
    themeLight: "Light",
    themeDark: "Dark",
    language: "Language",
    languageDescription: "Choose the display language for the app.",
    languageVi: "Tiếng Việt",
    languageEn: "English",
    savingPrefs: "Saving preferences...",
    savedPrefs: "Display preferences saved.",
    loadError: "Could not load display preferences.",
    saveError: "Could not save display preferences.",
    languageSavedPrefs: "Language preferences saved.",
    languageSaveError: "Could not save language preferences.",
    retry: "Retry",
  },

  profile: {
    title: "Profile Information",
    fullName: "Full Name",
    bio: "Bio",
    role: "Role",
    specialty: "Specialty",
    save: "Save changes",
    saving: "Saving...",
    saveSuccess: "Profile has been updated.",
    saveError: "Could not save changes.",
    unnamed: "Unnamed",
    viewProfile: "View your profile page",
  },

  security: {
    title: "Security",
    twoFactor: "Two-Factor Authentication",
    twoFactorDesc: "Protect your account by requiring a verification code when logging in.",
    loadError: "Could not load security preferences.",
    saving: "Saving...",
    saved: "Security preferences saved.",
    saveError: "Could not save security preferences.",
    retry: "Retry",
  },

  privacy: {
    title: "Privacy",
    loadError: "Could not load privacy preferences.",
    saving: "Saving...",
    saved: "Privacy preferences saved.",
    saveError: "Could not save privacy preferences.",
    retry: "Retry",
    
    activeStatus: "Show active status",
    activeStatusDesc: "Let others see when you are online.",
    readStatus: "Read receipts",
    readStatusDesc: "Show when you have read messages.",
    searchPhone: "Search by phone number",
    searchPhoneDesc: "Let others find you using your phone number.",
    allFriends: "Show all friends",
    allFriendsDesc: "Show people even if they haven't joined the app yet.",
    showPosts: "Show my posts",
    showPostsDesc: "Let others see your posts.",
    postLimit: "Post time limit",
    postLimitDesc: "Only show posts after a specific date.",
    
    canText: "Who can message me",
    canTextDesc: "Control who can send you messages.",
    canCall: "Who can call me",
    canCallDesc: "Control who can call you.",
    showDob: "Show birthday",
    showDobDesc: "How your date of birth is displayed.",

    options: {
      everybody: "Everybody",
      friends: "Friends",
      nobody: "Nobody",
      fullDate: "Full Date",
      monthDay: "Month & Day",
      year: "Year Only",
      none: "Hidden",
    }
  },

  notification: {
    title: "Notifications",
    loadError: "Could not load notification preferences.",
    saving: "Saving...",
    saved: "Notification preferences saved.",
    saveError: "Could not save notification preferences.",
    retry: "Retry",

    groups: {
      messages: "Messages",
      calls: "Calls",
      friendActivity: "Friend Activity",
      inApp: "In-App"
    },

    directMessage: "Direct messages",
    directMessageDesc: "Receive notifications for new direct messages.",
    previewMessage: "Preview messages",
    previewMessageDesc: "Show message content in notifications.",
    groupMessage: "Group messages",
    groupMessageDesc: "Receive notifications from groups.",
    
    incomingCall: "Incoming calls",
    incomingCallDesc: "Receive notifications for incoming calls.",
    
    newPost: "New posts",
    newPostDesc: "Notify when friends publish new posts.",
    birthday: "Birthdays",
    birthdayDesc: "Receive friend birthday notifications.",
    
    inAppNotice: "In-app notifications",
    inAppNoticeDesc: "Show notifications while using the app.",
    vibrate: "Vibrate on new message",
    vibrateDesc: "Vibrate device when receiving new messages in-app."
  },

  message: {
    title: "Messaging",
    loadError: "Could not load messaging preferences.",
    saving: "Saving...",
    saved: "Messaging preferences saved.",
    saveError: "Could not save messaging preferences.",
    retry: "Retry",

    quickReply: "Quick replies",
    quickReplyDesc: "Use templates to reply quickly.",
    priorityInbox: "Separate priority inbox",
    priorityInboxDesc: "Split inbox into Priority and Other.",
    typingStatus: "Typing status",
    typingStatusDesc: "Show when you are typing a message."
  },

  syncUtilities: {
    title: "Sync & Utilities",
    loadError: "Could not load sync and utilities preferences.",
    saving: "Saving...",
    savedSync: "Sync preferences saved.",
    savedUtil: "Utilities preferences saved.",
    saveError: "Could not save preferences.",
    retry: "Retry",

    groups: {
      sync: "Sync",
      utilities: "Utilities"
    },

    syncSuggest: "Sync suggestions",
    syncSuggestDesc: "Automatically suggest data syncing.",
    syncProgress: "Show sync progress",
    syncProgressDesc: "Display progress bar while syncing.",
    stickerSuggest: "Sticker suggestions",
    stickerSuggestDesc: "Suggest stickers while you type."
  },

  about: {
    title: "About Coffee Monitor",
    p1Start: "is not just a management app, but a reliable companion for Vietnamese farmers. Our mission is to apply digital technology to coffee farms, helping farmers optimize yields and protect the environment.",
    p2: "We focus on creating intuitive, easy-to-use tools suitable for all ages, making tracking crop health simpler than ever.",
    stats: {
      farmers: "Farmers",
      experts: "Experts",
      support: "Support"
    },
    hotline: "Connect with us via hotline: "
  }
};
