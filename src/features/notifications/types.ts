export type PushSupportState = 'idle' | 'checking' | 'supported' | 'unsupported' | 'unconfigured'

export type PushPermissionState = NotificationPermission | 'unsupported' | 'unconfigured'

export interface RegisterPushTokenPayload {
  userId: string
  platform: 'WEB'
  deviceIdentifier: string
  fcmToken: string
}
