import { useEffect } from 'react'
import { useSettingsStore } from '../../settings/store/useSettingsStore'
import { useAuthStore } from '../../../store/authStore'

export function AuthSessionBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const profile = useSettingsStore((state) => state.profile)
  const isProfileLoading = useSettingsStore((state) => state.isLoading)
  const fetchProfile = useSettingsStore((state) => state.fetchProfile)

  useEffect(() => {
    if (!accessToken || profile || isProfileLoading) {
      return
    }

    void fetchProfile()
  }, [accessToken, profile, isProfileLoading, fetchProfile])

  useEffect(() => {
    if (!accessToken) {
      if (user !== null) {
        setUser(null)
      }
      return
    }

    if (!profile) {
      return
    }

    const nextUser = {
      id: profile.userId,
      name: profile.fullName,
      email: profile.email ?? undefined,
      phone: profile.phoneNumber ?? undefined,
      avatar: profile.avatar ?? profile.profilePicture ?? undefined
    }

    const isSameUser =
      user?.id === nextUser.id &&
      user?.name === nextUser.name &&
      user?.email === nextUser.email &&
      user?.phone === nextUser.phone &&
      user?.avatar === nextUser.avatar

    if (!isSameUser) {
      setUser(nextUser)
    }
  }, [accessToken, profile, setUser, user])

  return null
}
