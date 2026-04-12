import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../lib/routes";

/**
 * Protects admin routes.
 * - No accessToken → redirect to /login
 * - accountRole is not "ADMIN" (including null/loading) → redirect to /dashboard
 * - accountRole === "ADMIN" → render nested routes
 */
export function AdminRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const accountRole = useAuthStore((state) => state.accountRole);

  if (!accessToken) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  // While accountRole is still null (loading), block access defensively
  if (accountRole !== "ADMIN") {
    return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  }

  return <Outlet />;
}
