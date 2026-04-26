import { Navigate } from "react-router-dom";
import { ROUTES } from "../../../lib/routes";

export function DeviceIndexRedirect() {
  return <Navigate to={ROUTES.DASHBOARD.DEVICE_ONBOARDING} replace />;
}

export default DeviceIndexRedirect;
