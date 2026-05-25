import { Navigate, Outlet } from "react-router";
import { ROUTES } from "../lib/routes";
import { useAuthContext } from "../features/auth";

export const PublicRoute = () => {
  const { isAuthenticated, isAdmin } = useAuthContext();

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to={ROUTES.ADMIN.ROOT} replace />;
    }
    return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  }

  return <Outlet />;
};
