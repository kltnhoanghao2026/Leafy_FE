import type { WidenStrings } from "../../../i18n/types";
import type { settingsVi } from "./vi";

type SettingsTranslationDict = WidenStrings<typeof settingsVi>;

export const settingsEn: SettingsTranslationDict = {
  title: "System Settings",
  subtitle: "Manage your account and customize your experience.",
  copyright: "© 2024 Coffee Monitor Vietnam. All rights reserved.",

  tabs: {
    account: "Account",
    display: "Display",
    privacy: "Privacy",
    notifications: "Notifications",
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

  privacy: {
    title: "Privacy",
    loadError: "Could not load privacy preferences.",
    saving: "Saving...",
    saved: "Privacy preferences saved.",
    saveError: "Could not save privacy preferences.",
    retry: "Retry",

    consultingSharing: "Data Sharing with Consulting Experts",
    shareFarmPlots: "Share Farm Plots",
    shareFarmPlotsDesc: "Allow experts to view your farm plots and zones.",
    sharePlants: "Share Plants",
    sharePlantsDesc: "Allow experts to view your plants.",
    sharePlantEvents: "Share Plant Events",
    sharePlantEventsDesc: "Allow experts to view and create events for your plants.",
    sharePlans: "Share Treatment Plans",
    sharePlansDesc: "Allow experts to view your treatment plans.",
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
      friendActivity: "Friend Activity",
      inApp: "In-App"
    },

    directMessage: "Direct messages",
    directMessageDesc: "Receive notifications for new direct messages.",
    previewMessage: "Preview messages",
    previewMessageDesc: "Show message content in notifications.",
    groupMessage: "Group messages",
    groupMessageDesc: "Receive notifications from groups.",
    
    newPost: "New posts",
    newPostDesc: "Notify when friends publish new posts.",
    
    inAppNotice: "In-app notifications",
    inAppNoticeDesc: "Show notifications while using the app.",
  },
};
