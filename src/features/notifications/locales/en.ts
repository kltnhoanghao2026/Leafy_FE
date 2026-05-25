import type { notificationsVi } from './vi';
import type { WidenStrings } from '../../../i18n/types';

/**
 * English locale for notifications feature.
 * Type-checked against Vietnamese source of truth.
 */
export const notificationsEn: WidenStrings<typeof notificationsVi> = {
  // ── Popover header ────────────────────────────────────────────────────────
  title: 'Notifications',
  markAllRead: 'Mark all as read',
  markAllReadAriaLabel: 'Mark all as read',
  bellAriaLabel: 'Notifications',
  popoverTabsAriaLabel: 'Choose notification type',
  popoverTabNotifications: 'Notifications',
  popoverTabAlerts: 'Alerts',

  // ── Popover body states ───────────────────────────────────────────────────
  loadError: 'Could not load notifications.',
  retry: 'Retry',
  empty: 'No notifications yet.',
  allShown: 'All notifications shown',
  seeAll: 'See all notifications',
  popoverAlertsError: 'Could not load alerts.',
  popoverAlertsEmpty: 'No alerts need attention.',
  popoverAlertsViewAll: 'View all alerts',
  popoverAlertsFallbackMessage: 'New alert needs attention',

  // ── Notifications page ────────────────────────────────────────────────────
  pageTitle: 'Notifications',
  pageSubtitle: 'Stay up to date with your latest activity and interactions',
  tabAll: 'All',
  tabUnread: 'Unread',
  pageMarkAllRead: 'Mark all as read',
  pageLoadError: 'Could not load notifications',
  pageLoadErrorDetail: 'An error occurred while connecting.',
  pageTryAgain: 'Try again',
  emptyAllTitle: 'No notifications yet',
  emptyAllSubtitle: 'New notifications about community activity and system updates will appear here.',
  emptyUnreadTitle: "You're all caught up",
  emptyUnreadSubtitle: "Great! You haven't missed any important updates.",
  exploreCommunity: 'Explore community',
  allShownCount: (count: number) => `Showing all ${count} notifications`,

  // ── NotificationItem ──────────────────────────────────────────────────────
  defaultInteraction: 'interacted with you',
  defaultUser: 'User',

  // ── Relative time ─────────────────────────────────────────────────────────
  timeJustNow: 'Just now',
  timeMinutesAgo: (n: number) => `${n}m ago`,
  timeHoursAgo: (n: number) => `${n}h ago`,
  timeDaysAgo: (n: number) => `${n}d ago`,
  timeMonthsAgo: (n: number) => `${n}mo ago`,
  timeYearsAgo: (n: number) => `${n}y ago`,

  // ── PushNotificationBanner — blocked mode ─────────────────────────────────
  blockedTag: 'Notifications blocked',
  blockedTitle: 'Your browser has blocked notifications',
  blockedBody: 'Please re-enable notifications in your browser settings to receive real-time alerts about soil moisture, temperature, and plant diseases.',
  blockedDismiss: 'Dismiss',

  // ── error mode ────────────────────────────────────────────────────────────
  errorTag: 'Push registration incomplete',
  errorTitle: 'Push token could not be synced',
  errorBodyFallback: 'Permission was granted but the token could not be sent to the server. You can try syncing again.',
  errorLater: 'Later',
  errorRetry: 'Retry sync',

  // ── unconfigured mode ─────────────────────────────────────────────────────
  unconfiguredTag: 'Firebase not configured',
  unconfiguredTitle: 'Missing environment variables for web push',
  unconfiguredBody: 'Firebase Messaging and a VAPID key must be configured before the web app can generate push tokens.',

  // ── enable mode ───────────────────────────────────────────────────────────
  enableTag: 'Enable notifications for this device',
  enableTitle: 'Get real-time alerts for soil moisture, temperature, and plant diseases',
  enableBody: 'When you allow notifications, we will obtain an FCM token in your current browser and link it to your account.',
  enableLater: 'Later',
  enableButton: 'Enable notifications',
  enabling: 'Enabling...',
};
