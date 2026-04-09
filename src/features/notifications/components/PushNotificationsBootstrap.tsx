import { useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { buildWebDeviceIdentifier } from '../../../lib/clientDevice'
import { useAuthStore } from '../../../store/authStore'
import { useSettingsStore } from '../../settings/store/useSettingsStore'
import { PushNotificationBanner } from './PushNotificationBanner'
import {
  getCurrentFcmToken,
  isFirebaseMessagingConfigured,
  isWebPushSupported,
  registerMessagingServiceWorker,
  subscribeToForegroundMessages
} from '../services/firebaseMessaging'
import { apiRegisterPushToken } from '../services/pushApi'
import { usePushNotificationsStore } from '../store/usePushNotificationsStore'

function getPushErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Khong the khoi tao thong bao day'

  if (message.includes('permission')) {
    return 'Trinh duyet chua cap quyen thong bao cho thiet bi nay.'
  }

  if (message.includes('token')) {
    return 'Khong lay duoc FCM token tu Firebase Messaging.'
  }

  return message
}

export function PushNotificationsBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const currentUser = useAuthStore((state) => state.user)
  const profile = useSettingsStore((state) => state.profile)

  const supportState = usePushNotificationsStore((state) => state.supportState)
  const permission = usePushNotificationsStore((state) => state.permission)
  const syncStatus = usePushNotificationsStore((state) => state.syncStatus)
  const error = usePushNotificationsStore((state) => state.error)
  const isPromptDismissed = usePushNotificationsStore((state) => state.isPromptDismissed)
  const setSupportState = usePushNotificationsStore((state) => state.setSupportState)
  const setPermission = usePushNotificationsStore((state) => state.setPermission)
  const startSync = usePushNotificationsStore((state) => state.startSync)
  const setCurrentToken = usePushNotificationsStore((state) => state.setCurrentToken)
  const markSynced = usePushNotificationsStore((state) => state.markSynced)
  const markSyncError = usePushNotificationsStore((state) => state.markSyncError)
  const dismissPrompt = usePushNotificationsStore((state) => state.dismissPrompt)
  const resetPrompt = usePushNotificationsStore((state) => state.resetPrompt)
  const resetRuntimeState = usePushNotificationsStore((state) => state.resetRuntimeState)

  const resolvedUserId = currentUser?.id ?? profile?.userId ?? null

  const syncPushToken = useCallback(async (userId: string) => {
    const {
      syncStatus: currentSyncStatus,
      lastSyncedToken,
      lastSyncedUserId
    } = usePushNotificationsStore.getState()

    if (currentSyncStatus === 'syncing') {
      return
    }

    startSync()

    try {
      const registration = await registerMessagingServiceWorker()
      const fcmToken = await getCurrentFcmToken(registration)

      if (!fcmToken) {
        throw new Error('missing-fcm-token')
      }

      setCurrentToken(fcmToken)

      if (lastSyncedToken === fcmToken && lastSyncedUserId === userId) {
        markSynced(fcmToken, userId)
        return
      }

      await apiRegisterPushToken({
        platform: 'WEB',
        deviceIdentifier: buildWebDeviceIdentifier(),
        fcmToken
      })

      markSynced(fcmToken, userId)
    } catch (syncError) {
      markSyncError(getPushErrorMessage(syncError))
    }
  }, [markSyncError, markSynced, setCurrentToken, startSync])

  useEffect(() => {
    if (!accessToken || !resolvedUserId) {
      resetRuntimeState()
      return
    }

    const userId = resolvedUserId
    let cancelled = false

    async function initializePushFlow() {
      setSupportState('checking')

      if (!isFirebaseMessagingConfigured()) {
        if (!cancelled) {
          setSupportState('unconfigured')
          setPermission('unconfigured')
        }
        return
      }

      const supported = await isWebPushSupported()
      if (!supported) {
        if (!cancelled) {
          setSupportState('unsupported')
          setPermission('unsupported')
        }
        return
      }

      const nextPermission = Notification.permission
      if (!cancelled) {
        setSupportState('supported')
        setPermission(nextPermission)
      }

      if (nextPermission === 'granted') {
        await syncPushToken(userId)
      }
    }

    void initializePushFlow()

    return () => {
      cancelled = true
    }
  }, [accessToken, resolvedUserId, resetRuntimeState, setPermission, setSupportState, syncPushToken])

  useEffect(() => {
    if (!accessToken || permission !== 'granted' || supportState !== 'supported') {
      return
    }

    const unsubscribe = subscribeToForegroundMessages((payload) => {
      const title = payload.notification?.title || 'Thong bao moi'
      const body = payload.notification?.body

      toast(title, {
        id: `push-${payload.messageId ?? title}`,
        duration: 5000
      })

      if (body) {
        console.info('Foreground push payload:', body)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [accessToken, permission, supportState])

  useEffect(() => {
    if (!accessToken || supportState !== 'supported') {
      return
    }

    function handleVisibilityChange() {
      const nextPermission = Notification.permission
      setPermission(nextPermission)

      if (nextPermission === 'granted' && resolvedUserId) {
        resetPrompt()
        void syncPushToken(resolvedUserId)
      }
    }

    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [accessToken, resolvedUserId, resetPrompt, setPermission, supportState, syncPushToken])

  async function handleEnableNotifications() {
    if (!resolvedUserId) {
      return
    }

    try {
      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)

      if (nextPermission !== 'granted') {
        if (nextPermission === 'denied') {
          dismissPrompt()
        }
        return
      }

      resetPrompt()
      await syncPushToken(resolvedUserId)
      toast.success('Thiet bi da san sang nhan thong bao')
    } catch (requestError) {
      markSyncError(getPushErrorMessage(requestError))
    }
  }

  function handleRetrySync() {
    if (!resolvedUserId) {
      return
    }

    void syncPushToken(resolvedUserId)
  }

  if (!accessToken || !resolvedUserId) {
    return null
  }

  if (supportState === 'unsupported') {
    return null
  }

  if (supportState === 'unconfigured') {
    return (
      <PushNotificationBanner
        mode="unconfigured"
        isBusy={false}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    )
  }

  if (permission === 'default' && !isPromptDismissed) {
    return (
      <PushNotificationBanner
        mode="enable"
        isBusy={syncStatus === 'syncing'}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    )
  }

  if (permission === 'denied' && !isPromptDismissed) {
    return (
      <PushNotificationBanner
        mode="blocked"
        isBusy={false}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    )
  }

  if (permission === 'granted' && syncStatus === 'error' && !isPromptDismissed) {
    return (
      <PushNotificationBanner
        mode="error"
        isBusy={false}
        errorMessage={error}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    )
  }

  return null
}
