import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../lib/routes";

/**
 * Guest-only routes (login, register, verify).
 * Waits for silent-refresh initialisation, then redirects authenticated users.
 */
export function GuestOnlyRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return null;
  }

  if (accessToken) {
    return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  }

  return <Outlet />;
}
