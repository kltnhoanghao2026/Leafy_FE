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

  console.log(
    `[AdminRoute] isInitializing=${isInitializing} hasToken=${!!accessToken} accountRole=${accountRole}`,
  );

  if (isInitializing) {
    console.log("[AdminRoute] -> waiting (isInitializing)");
    return null;
  }

  if (!accessToken) {
    console.log("[AdminRoute] -> redirect to login (no accessToken)");
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  if (accountRole === null) {
    console.log("[AdminRoute] -> waiting (accountRole not yet loaded)");
    return null;
  }

  if (accountRole !== "ADMIN") {
    console.warn(
      `[AdminRoute] -> redirect to dashboard (accountRole=${accountRole}, expected ADMIN)`,
    );
    return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  }

  console.log("[AdminRoute] -> access granted");
  return <Outlet />;
}
