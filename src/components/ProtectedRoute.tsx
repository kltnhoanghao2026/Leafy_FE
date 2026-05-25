import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../lib/routes";

/**
 * Protects dashboard routes.
 * Waits for the silent-refresh initialisation, then redirects if no token.
 */
export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return null;
  }

  if (!accessToken) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
}
