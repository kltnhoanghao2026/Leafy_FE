import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useDeactivatePushTokenMutation } from "../../notifications/queries";
import { usePushNotificationsStore } from "../../notifications/store/usePushNotificationsStore";
import { useSettingsStore } from "../../settings/store/useSettingsStore";
import { useAuthStore } from "../../../store/authStore";
import { authApi } from "../api/auth.api";
import { clearPendingEmail } from "../../../store/registerStore";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const resetProfile = useSettingsStore((state) => state.resetProfile);
  const resetPushState = usePushNotificationsStore((state) => state.resetState);
  const deactivatePushToken = useDeactivatePushTokenMutation();

  return async function handleLogout() {
    const { currentToken } = usePushNotificationsStore.getState();

    if (currentToken) {
      try {
        await deactivatePushToken.mutateAsync(currentToken);
      } catch (error) {
        console.error("Deactivate push token failed:", error);
      }
    }

    // Invalidate the refresh token server-side and clear the HttpOnly cookie.
    try {
      await authApi.logout();
    } catch {
      // Proceed with local cleanup even if the server request fails.
    }

    resetPushState();
    resetProfile();
    logout();
    clearPendingEmail();
    queryClient.clear();
    navigate("/login", { replace: true });
  };
}
