export type PushSupportState = 'idle' | 'checking' | 'supported' | 'unsupported' | 'unconfigured'

export type PushPermissionState = NotificationPermission | 'unsupported' | 'unconfigured'

export interface RegisterPushTokenPayload {
  userId: string
  platform: 'WEB'
  deviceIdentifier: string
  fcmToken: string
}

export interface UserNotificationResponse {
  id: string
  type: string
  referenceId: string | null
  /** Most-recent actor (alias for `actorIds[0]`). */
  actorId: string | null
  actorName: string | null
  actorAvatar: string | null
  /**
   * Distinct profile IDs of all actors merged into this notification —
   * most-recent first. Always contains at least `actorId` for non-batched rows.
   */
  actorIds: string[]
  /** `actorIds.length` — denormalized for fast read access. */
  actorCount: number
  /** `max(0, actorCount - 1)` — used for "X and N others" rendering. */
  othersCount: number
  /** Total number of raw events merged into this notification. */
  totalEventCount: number
  title: string
  body: string
  isRead: boolean
  occurredAt: string
  /**
   * Additional data for template rendering and navigation.
   * For DIRECT_MESSAGE, contains conversationId for navigation.
   */
  payload?: Record<string, string>
}

export interface NotificationStateResponse {
  unreadCount: number
  lastCheckedAt: string | null
}

export interface InAppNotificationPayload {
  notificationId: string
  type: string
  referenceId: string | null
  actorId: string | null
  actorName: string | null
  actorAvatar: string | null
  actorIds: string[]
  actorCount: number
  othersCount: number
  totalEventCount: number
  title: string
  body: string
  occurredAt: string
  /** Additional data for navigation (e.g., conversationId for DIRECT_MESSAGE) */
  payload?: Record<string, string>
}

