export type PushSupportState = 'idle' | 'checking' | 'supported' | 'unsupported' | 'unconfigured'

export type PushPermissionState = NotificationPermission | 'unsupported' | 'unconfigured'

export interface RegisterPushTokenPayload {
  platform: 'WEB'
  deviceIdentifier: string
  fcmToken: string
}
