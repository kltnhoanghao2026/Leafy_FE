import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { PushNotificationsBootstrap } from "./PushNotificationsBootstrap";
import { useLogout } from "../../auth/hooks/useLogout";
import { useAuthStore } from "../../../store/authStore";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import { usePushNotificationsStore } from "../store/usePushNotificationsStore";
import {
  getCurrentFcmToken,
  isFirebaseMessagingConfigured,
  isWebPushSupported,
  registerMessagingServiceWorker,
  subscribeToForegroundMessages,
} from "../services/firebaseMessaging";

vi.mock("../services/firebaseMessaging", () => ({
  getCurrentFcmToken: vi.fn(),
  isFirebaseMessagingConfigured: vi.fn(),
  isWebPushSupported: vi.fn(),
  registerMessagingServiceWorker: vi.fn(),
  subscribeToForegroundMessages: vi.fn(),
}));

const envelope = <T,>(data: T) => ({
  code: 1000,
  message: "success",
  data,
});

const profile = {
  id: "profile-1",
  userId: "user-1",
  fullName: "Backend Farmer",
  profilePicture: null,
  avatar: null,
  role: "FARMER",
  specialty: null,
  certificates: [],
  isVerified: false,
  bio: null,
  addressLine: null,
  provinceCode: null,
  districtCode: null,
  wardCode: null,
  latitude: null,
  longitude: null,
  active: true,
  email: "farmer@example.com",
  phoneNumber: null,
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
};

const configureNotificationPermission = (permission: NotificationPermission) => {
  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    value: {
      permission,
      requestPermission: vi.fn(async () => permission),
    },
  });
};

function LogoutProbe() {
  const logout = useLogout();
  return (
    <button type="button" onClick={() => void logout()}>
      Logout
    </button>
  );
}

describe("PushNotificationsBootstrap", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        name: "Backend Farmer",
        email: "farmer@example.com",
      },
      accessToken: "access-token",
      isLoading: false,
      rememberMe: false,
    });
    usePushNotificationsStore.getState().resetState();
    configureNotificationPermission("granted");
    vi.mocked(isFirebaseMessagingConfigured).mockReturnValue(true);
    vi.mocked(isWebPushSupported).mockResolvedValue(true);
    vi.mocked(registerMessagingServiceWorker).mockResolvedValue(
      {} as ServiceWorkerRegistration,
    );
    vi.mocked(getCurrentFcmToken).mockResolvedValue("fcm-token-1");
    vi.mocked(subscribeToForegroundMessages).mockReturnValue(() => undefined);
    server.use(
      http.get("*/api/profiles/me", () => {
        return HttpResponse.json(envelope(profile));
      }),
    );
  });

  it("registers a push token through the canonical backend path with user id", async () => {
    let submittedBody: unknown = null;

    server.use(
      http.post("*/api/push-tokens", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.text("Push token registered successfully");
      }),
    );

    renderWithClient(<PushNotificationsBootstrap />, { route: "/dashboard" });

    await waitFor(() => {
      expect(submittedBody).toMatchObject({
        userId: "user-1",
        platform: "WEB",
        fcmToken: "fcm-token-1",
      });
    });
    expect(registerMessagingServiceWorker).toHaveBeenCalled();
    expect(getCurrentFcmToken).toHaveBeenCalled();
  });

  it("does not register the same token twice for the same user", async () => {
    let callCount = 0;

    server.use(
      http.post("*/api/push-tokens", () => {
        callCount += 1;
        return HttpResponse.text("Push token registered successfully");
      }),
    );

    const { rerender } = renderWithClient(<PushNotificationsBootstrap />, {
      route: "/dashboard",
    });

    await waitFor(() => {
      expect(callCount).toBe(1);
    });

    rerender(<PushNotificationsBootstrap />);

    await waitFor(() => {
      expect(callCount).toBe(1);
    });
  });

  it("deactivates the current push token on logout without using stale paths", async () => {
    let deactivateBody: unknown = null;
    let staleDeactivateCalled = false;
    usePushNotificationsStore.setState({
      currentToken: "fcm-token-logout",
    });

    server.use(
      http.post("*/api/push-tokens/deactivate", async ({ request }) => {
        deactivateBody = await request.json();
        return HttpResponse.text("Push token deactivated successfully");
      }),
      http.post("*/api/notifications/push-tokens/deactivate", () => {
        staleDeactivateCalled = true;
        return HttpResponse.text("wrong path", { status: 500 });
      }),
    );

    renderWithClient(
      <Routes>
        <Route path="/dashboard" element={<LogoutProbe />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      { route: "/dashboard" },
    );

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(deactivateBody).toEqual({ fcmToken: "fcm-token-logout" });
    });
    expect(staleDeactivateCalled).toBe(false);
    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("continues logout if push token deactivate fails", async () => {
    usePushNotificationsStore.setState({
      currentToken: "fcm-token-logout",
    });
    server.use(
      http.post("*/api/push-tokens/deactivate", () => {
        return HttpResponse.text("boom", { status: 500 });
      }),
    );

    renderWithClient(
      <Routes>
        <Route path="/dashboard" element={<LogoutProbe />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      { route: "/dashboard" },
    );

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });
});
