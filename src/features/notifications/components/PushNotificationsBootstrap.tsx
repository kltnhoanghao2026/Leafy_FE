import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { buildWebDeviceIdentifier } from "../../../lib/clientDevice";
import { useAuthStore } from "../../../store/authStore";
import { useMyProfile } from "../../settings/queries";
import { PushNotificationBanner } from "./PushNotificationBanner";
import {
  getCurrentFcmToken,
  isFirebaseMessagingConfigured,
  isWebPushSupported,
  registerMessagingServiceWorker,
  subscribeToForegroundMessages,
} from "../services/firebaseMessaging";
import { pushApi } from "../api/push.api";
import { alertKeys } from "../../alerts/queries";
import { notificationKeys } from "../queries";
import { usePushNotificationsStore } from "../store/usePushNotificationsStore";
import {
  markAlertRecentlyNotified,
  parseIotAlertFcmPayload,
} from "../utils/fcmNotifications";

function getPushErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Khong the khoi tao thong bao day";

  if (message.includes("permission")) {
    return "Trinh duyet chua cap quyen thong bao cho thiet bi nay.";
  }

  if (message.includes("token")) {
    return "Khong lay duoc FCM token tu Firebase Messaging.";
  }

  return message;
}

export function PushNotificationsBootstrap() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.user);
  const { data: profile } = useMyProfile(!!accessToken);

  const supportState = usePushNotificationsStore((state) => state.supportState);
  const permission = usePushNotificationsStore((state) => state.permission);
  const syncStatus = usePushNotificationsStore((state) => state.syncStatus);
  const error = usePushNotificationsStore((state) => state.error);
  const isPromptDismissed = usePushNotificationsStore(
    (state) => state.isPromptDismissed,
  );
  const setSupportState = usePushNotificationsStore(
    (state) => state.setSupportState,
  );
  const setPermission = usePushNotificationsStore(
    (state) => state.setPermission,
  );
  const startSync = usePushNotificationsStore((state) => state.startSync);
  const setCurrentToken = usePushNotificationsStore(
    (state) => state.setCurrentToken,
  );
  const markSynced = usePushNotificationsStore((state) => state.markSynced);
  const markSyncError = usePushNotificationsStore(
    (state) => state.markSyncError,
  );
  const dismissPrompt = usePushNotificationsStore(
    (state) => state.dismissPrompt,
  );
  const resetPrompt = usePushNotificationsStore((state) => state.resetPrompt);
  const resetRuntimeState = usePushNotificationsStore(
    (state) => state.resetRuntimeState,
  );

  const resolvedUserId = currentUser?.id ?? profile?.userId ?? null;

  const syncPushToken = useCallback(
    async (userId: string) => {
      const {
        syncStatus: currentSyncStatus,
        lastSyncedToken,
        lastSyncedUserId,
      } = usePushNotificationsStore.getState();

      if (currentSyncStatus === "syncing") {
        return;
      }

      startSync();

      try {
        const registration = await registerMessagingServiceWorker();
        const fcmToken = await getCurrentFcmToken(registration);

        if (!fcmToken) {
          throw new Error("missing-fcm-token");
        }

        setCurrentToken(fcmToken);

        if (lastSyncedToken === fcmToken && lastSyncedUserId === userId) {
          markSynced(fcmToken, userId);
          return;
        }

        await pushApi.registerToken({
          userId,
          platform: "WEB",
          deviceIdentifier: buildWebDeviceIdentifier(),
          fcmToken,
        });

        markSynced(fcmToken, userId);
      } catch (syncError) {
        markSyncError(getPushErrorMessage(syncError));
      }
    },
    [markSyncError, markSynced, setCurrentToken, startSync],
  );

  useEffect(() => {
    if (!accessToken || !resolvedUserId) {
      resetRuntimeState();
      return;
    }

    const userId = resolvedUserId;
    let cancelled = false;

    async function initializePushFlow() {
      setSupportState("checking");

      if (!isFirebaseMessagingConfigured()) {
        if (!cancelled) {
          setSupportState("unconfigured");
          setPermission("unconfigured");
        }
        return;
      }

      const supported = await isWebPushSupported();
      if (!supported) {
        if (!cancelled) {
          setSupportState("unsupported");
          setPermission("unsupported");
        }
        return;
      }

      const nextPermission = Notification.permission;
      if (!cancelled) {
        setSupportState("supported");
        setPermission(nextPermission);
      }

      if (nextPermission === "granted") {
        await syncPushToken(userId);
      }
    }

    void initializePushFlow();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    resolvedUserId,
    resetRuntimeState,
    setPermission,
    setSupportState,
    syncPushToken,
  ]);

  useEffect(() => {
    if (
      !accessToken ||
      permission !== "granted" ||
      supportState !== "supported"
    ) {
      return;
    }

    const unsubscribe = subscribeToForegroundMessages((payload) => {
      const notificationType = payload.data?.type;

      if (notificationType === 'DIRECT_MESSAGE') {
        return;
      }

      const iotAlert = parseIotAlertFcmPayload(payload);

      if (iotAlert) {
        markAlertRecentlyNotified(iotAlert.alertEventId);
        queryClient.invalidateQueries({ queryKey: alertKeys.all() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.all() });

        toast(
          (toastItem) => (
            <button
              type="button"
              className="block max-w-sm text-left"
              onClick={() => {
                toast.dismiss(toastItem.id);
                navigate(iotAlert.url);
              }}
            >
              <span className="block text-sm font-black text-slate-900">
                {iotAlert.title}
              </span>
              {iotAlert.body ? (
                <span className="mt-1 block text-sm font-semibold text-slate-600">
                  {iotAlert.severity ? `${iotAlert.severity} · ` : ""}
                  {iotAlert.body}
                </span>
              ) : null}
              <span className="mt-2 block text-xs font-black text-emerald-700">
                Xem cảnh báo
              </span>
            </button>
          ),
          {
            id: `fcm-iot-alert-${iotAlert.alertEventId}`,
            duration: 8_000,
          },
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: notificationKeys.all() });

      const title = payload.notification?.title || "Thong bao moi";
      const body = payload.notification?.body;

      toast(title, {
        id: `push-${payload.messageId ?? title}`,
        duration: 5000,
      });

      if (body) {
        console.info("Foreground push payload:", body);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [accessToken, navigate, permission, queryClient, supportState]);

  useEffect(() => {
    if (!accessToken || supportState !== "supported") {
      return;
    }

    function handleVisibilityChange() {
      const nextPermission = Notification.permission;
      setPermission(nextPermission);

      if (nextPermission === "granted" && resolvedUserId) {
        resetPrompt();
        void syncPushToken(resolvedUserId);
      }
    }

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    accessToken,
    resolvedUserId,
    resetPrompt,
    setPermission,
    supportState,
    syncPushToken,
  ]);

  async function handleEnableNotifications() {
    if (!resolvedUserId) {
      return;
    }

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        if (nextPermission === "denied") {
          dismissPrompt();
        }
        return;
      }

      resetPrompt();
      await syncPushToken(resolvedUserId);
      toast.success("Thiet bi da san sang nhan thong bao");
    } catch (requestError) {
      markSyncError(getPushErrorMessage(requestError));
    }
  }

  function handleRetrySync() {
    if (!resolvedUserId) {
      return;
    }

    void syncPushToken(resolvedUserId);
  }

  if (!accessToken || !resolvedUserId) {
    return null;
  }

  if (supportState === "unsupported") {
    return null;
  }

  const isAlertTab =
    location.pathname.includes("/alerts") ||
    location.pathname.includes("/alert-rules");

  if (!isAlertTab) {
    return null;
  }

  if (supportState === "unconfigured") {
    return (
      <PushNotificationBanner
        mode="unconfigured"
        isBusy={false}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    );
  }

  if (permission === "default" && !isPromptDismissed) {
    return (
      <PushNotificationBanner
        mode="enable"
        isBusy={syncStatus === "syncing"}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    );
  }

  if (permission === "denied" && !isPromptDismissed) {
    return (
      <PushNotificationBanner
        mode="blocked"
        isBusy={false}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    );
  }

  if (
    permission === "granted" &&
    syncStatus === "error" &&
    !isPromptDismissed
  ) {
    return (
      <PushNotificationBanner
        mode="error"
        isBusy={false}
        errorMessage={error}
        onEnable={handleEnableNotifications}
        onRetry={handleRetrySync}
        onDismiss={dismissPrompt}
      />
    );
  }

  return null;
}
