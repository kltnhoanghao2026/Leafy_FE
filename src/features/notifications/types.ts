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
  actorId: string | null
  actorName: string | null
  actorAvatar: string | null
  title: string
  body: string
  isRead: boolean
  occurredAt: string
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
  title: string
  body: string
  occurredAt: string
}

