import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Guest-only routes (login, register, verify).
 * If accessToken exists → redirect to /dashboard.
 */
export function GuestOnlyRoute () {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (accessToken) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
