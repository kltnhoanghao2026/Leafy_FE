import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../lib/routes";

/**
 * Protects admin routes.
 * - Initializing → wait
 * - No accessToken → redirect to /login
 * - accountRole !== "ADMIN" → redirect to /dashboard
 */
export function AdminRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const accountRole = useAuthStore((state) => state.accountRole);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return null;
  }

  if (!accessToken) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  // While accountRole is still null (loading), block access defensively
  if (accountRole !== "ADMIN") {
    return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  }

  return <Outlet />;
}
