import { useNavigate } from 'react-router-dom'
import { apiDeactivatePushToken } from '../../notifications/services/pushApi'
import { usePushNotificationsStore } from '../../notifications/store/usePushNotificationsStore'
import { useSettingsStore } from '../../settings/store/useSettingsStore'
import { useAuthStore } from '../../../store/authStore'

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const resetProfile = useSettingsStore((state) => state.resetProfile)
  const resetPushState = usePushNotificationsStore((state) => state.resetState)

  return async function handleLogout() {
    const { currentToken } = usePushNotificationsStore.getState()

    if (currentToken) {
      try {
        await apiDeactivatePushToken(currentToken)
      } catch (error) {
        console.error('Deactivate push token failed:', error)
      }
    }

    resetPushState()
    resetProfile()
    logout()
    navigate('/login', { replace: true })
  }
}
