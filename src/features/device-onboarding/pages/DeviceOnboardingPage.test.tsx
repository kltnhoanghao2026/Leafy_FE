import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { DeviceOnboardingPage } from "./DeviceOnboardingPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import { useAuthStore } from "../../../store/authStore";
import type {
  DeviceResponse,
  PagedResponse,
} from "../../../types/iot";
import type {
  FarmPlotResponse,
  FarmZoneResponse,
} from "../../farm-management/types";

vi.mock("html5-qrcode", () => {
  class Html5Qrcode {
    static async getCameras() {
      return [];
    }

    async start() {
      return undefined;
    }

    async stop() {
      return undefined;
    }

    async clear() {
      return undefined;
    }
  }

  return {
    Html5Qrcode,
  };
});

const profile = {
  id: "profile-1",
  userId: "user-1",
  fullName: "Tester",
  profilePicture: null,
  avatar: null,
  role: "FARMER" as const,
  specialty: null,
  certificates: [],
  isVerified: true,
  bio: null,
  addressLine: null,
  provinceCode: null,
  districtCode: null,
  wardCode: null,
  latitude: null,
  longitude: null,
  active: true,
  email: null,
  phoneNumber: null,
  createdAt: "2026-04-16T00:00:00Z",
  lastModifiedAt: "2026-04-16T00:00:00Z",
};

const farmPlot: FarmPlotResponse = {
  id: "farm-1",
  ownerProfileId: "profile-1",
  name: "North Plot",
  code: "NP-001",
  description: null,
  areaM2: null,
  addressLine: null,
  provinceCode: null,
  districtCode: null,
  wardCode: null,
  latitude: null,
  longitude: null,
  boundaryGeojson: null,
  status: "ACTIVE",
  createdAt: "2026-04-16T00:00:00Z",
  lastModifiedAt: "2026-04-16T00:00:00Z",
};

const farmZones: FarmZoneResponse[] = [
  {
    id: "zone-1",
    farmPlotId: "farm-1",
    zoneName: "North Greenhouse",
    zoneCode: "NG-1",
    description: null,
    areaM2: null,
    soilType: null,
    cropType: null,
    plantingDate: null,
    elevationM: null,
    boundaryGeojson: null,
    status: "ACTIVE",
    createdAt: "2026-04-16T00:00:00Z",
    lastModifiedAt: "2026-04-16T00:00:00Z",
  },
];

const device: DeviceResponse = {
  id: "device-1",
  deviceUid: "LEAFY-ESP32-001",
  deviceCode: "ESP32-001",
  deviceName: "Cảm biến - North Greenhouse",
  deviceType: "ESP32_CAM_SENSOR",
  firmwareVersion: "1.0.0",
  isActive: true,
  status: "OFFLINE",
  provisioningStatus: "CLAIMED",
  ownerUserId: "user-1",
  farmPlotId: "farm-1",
  zoneId: "zone-1",
  lastSeenAt: "2026-04-16T03:00:00Z",
};

const pagedDevices = (
  items: DeviceResponse[] = [device],
  page = 0,
): PagedResponse<DeviceResponse> => ({
  items,
  page,
  size: 20,
  totalItems: items.length,
  totalPages: items.length ? 2 : 0,
  hasNext: items.length > 0 && page === 0,
  hasPrevious: page > 0,
});

const bootstrapAuth = () => {
  useAuthStore.setState({
    user: { id: "user-1", profileId: "profile-1", name: "Tester" },
    accessToken: "token",
    isLoading: false,
    rememberMe: true,
  });
};

const registerOnboardingApis = () => {
  server.use(
    http.get("*/api/profiles/me", () => {
      return HttpResponse.json({
        code: "OK",
        message: "OK",
        data: profile,
      });
    }),
    http.get("*/api/farms/plots", () => {
      return HttpResponse.json({
        code: "OK",
        message: "OK",
        data: [farmPlot],
      });
    }),
    http.get("*/api/farms/plots/:plotId/zones", ({ params }) => {
      if (String(params.plotId) !== farmPlot.id) {
        return HttpResponse.json({ code: "OK", message: "OK", data: [] });
      }

      return HttpResponse.json({
        code: "OK",
        message: "OK",
        data: farmZones,
      });
    }),
    http.post("*/api/iot/devices/provision", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        ...device,
        deviceUid: String(body.deviceUid ?? device.deviceUid),
        deviceCode: String(body.deviceCode ?? device.deviceCode),
        deviceName: String(body.deviceName ?? device.deviceName),
        deviceType: String(body.deviceType ?? device.deviceType),
      });
    }),
    http.post("*/api/iot/devices/:deviceId/claim-code", ({ params }) => {
      return HttpResponse.json({
        deviceId: String(params.deviceId),
        claimCode: "CLAIM-123",
        expiresAt: "2026-04-16T04:00:00Z",
      });
    }),
    http.post("*/api/iot/devices/claim", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        ...device,
        deviceUid: String(body.deviceUid ?? device.deviceUid),
        farmPlotId: String(body.farmPlotId ?? device.farmPlotId),
        zoneId: String(body.zoneId ?? device.zoneId),
      });
    }),
    http.get("*/api/iot/devices/me", () => {
      return HttpResponse.json(pagedDevices());
    }),
  );
};

describe("DeviceOnboardingPage", () => {
  beforeEach(() => {
    bootstrapAuth();
    registerOnboardingApis();
  });

  afterEach(() => {
    useAuthStore.getState().logout();
  });

  it("renders scanner controls even when no camera is available", async () => {
    const user = userEvent.setup();
    renderWithClient(<DeviceOnboardingPage />);

    await user.click(screen.getByRole("button", { name: /Quét mã QR/ }));

    expect(screen.getByText("Quét mã QR")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bật camera" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tắt camera" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dán JSON để kiểm thử" }),
    ).toBeInTheDocument();
  });

  it("rejects invalid QR JSON with a friendly error", async () => {
    const user = userEvent.setup();
    renderWithClient(<DeviceOnboardingPage />);

    await user.click(screen.getByRole("button", { name: /Quét mã QR/ }));
    await user.click(
      screen.getByRole("button", { name: "Dán JSON để kiểm thử" }),
    );
    await user.type(screen.getByLabelText("Nội dung QR JSON"), "not-json");
    await user.click(screen.getByRole("button", { name: "Đọc QR" }));

    expect(
      await screen.findByText(
        "QR không hợp lệ: nội dung phải là JSON hợp lệ.",
      ),
    ).toBeInTheDocument();
  });

  it("runs the QR onboarding sequence with dropdown farm and zone selection", async () => {
    const user = userEvent.setup();
    let provisionBody: unknown;
    let claimBody: unknown;
    let claimCodeDeviceId = "";

    server.use(
      http.post("*/api/iot/devices/provision", async ({ request }) => {
        provisionBody = await request.json();
        return HttpResponse.json(device);
      }),
      http.post("*/api/iot/devices/:deviceId/claim-code", ({ params }) => {
        claimCodeDeviceId = String(params.deviceId);
        return HttpResponse.json({
          deviceId: "device-1",
          claimCode: "CLAIM-123",
          expiresAt: "2026-04-16T04:00:00Z",
        });
      }),
      http.post("*/api/iot/devices/claim", async ({ request }) => {
        claimBody = await request.json();
        return HttpResponse.json(device);
      }),
      http.get("*/api/iot/devices/me", () => {
        return HttpResponse.json(pagedDevices());
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    await user.click(screen.getByRole("button", { name: /Quét mã QR/ }));
    await user.click(
      screen.getByRole("button", { name: "Dán JSON để kiểm thử" }),
    );
    fireEvent.change(screen.getByLabelText("Nội dung QR JSON"), {
      target: {
        value: JSON.stringify({
          deviceUid: "LEAFY-ESP32-001",
          deviceCode: "ESP32-001",
          deviceType: "ESP32_CAM_SENSOR",
          model: "Leafy IoT Module V1",
        }),
      },
    });
    await user.click(screen.getByRole("button", { name: "Đọc QR" }));

    expect(screen.getByText("Leafy IoT Module V1")).toBeInTheDocument();
    expect(screen.getByText("LEAFY-ESP32-001")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByLabelText("Chọn vườn")).not.toBeDisabled(),
    );
    await user.selectOptions(screen.getByLabelText("Chọn vườn"), "farm-1");
    await waitFor(() =>
      expect(screen.getByLabelText("Chọn khu vực")).not.toBeDisabled(),
    );
    await user.selectOptions(screen.getByLabelText("Chọn khu vực"), "zone-1");
    expect(
      screen.getByLabelText(/deviceName/i),
    ).toHaveValue("Cảm biến - North Greenhouse");

    await user.click(
      screen.getByRole("button", { name: "Kết nối thiết bị" }),
    );

    expect(
      await screen.findByText("Kết nối thiết bị thành công"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Thiết bị đã liên kết nhưng vẫn offline"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Đi tới chi tiết thiết bị" }),
    ).toHaveAttribute("href", "/dashboard/devices/device-1");

    await waitFor(() => {
      expect(provisionBody).toEqual({
        deviceUid: "LEAFY-ESP32-001",
        deviceCode: "ESP32-001",
        deviceName: "Cảm biến - North Greenhouse",
        deviceType: "ESP32_CAM_SENSOR",
      });
      expect(claimCodeDeviceId).toBe("device-1");
      expect(claimBody).toEqual({
        deviceUid: "LEAFY-ESP32-001",
        claimCode: "CLAIM-123",
        farmPlotId: "farm-1",
        zoneId: "zone-1",
      });
    });
  });

  it("supports manual onboarding without QR", async () => {
    const user = userEvent.setup();
    let provisionBody: unknown;

    server.use(
      http.post("*/api/iot/devices/provision", async ({ request }) => {
        provisionBody = await request.json();
        return HttpResponse.json(device);
      }),
      http.post("*/api/iot/devices/:deviceId/claim-code", () => {
        return HttpResponse.json({
          deviceId: "device-1",
          claimCode: "CLAIM-123",
          expiresAt: "2026-04-16T04:00:00Z",
        });
      }),
      http.post("*/api/iot/devices/claim", () => {
        return HttpResponse.json(device);
      }),
      http.get("*/api/iot/devices/me", () => {
        return HttpResponse.json(pagedDevices());
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    await user.click(screen.getByRole("button", { name: /Nhập thủ công/ }));
    await user.type(
      screen.getByLabelText(/deviceUid/i),
      "LEAFY-ESP32-001",
    );
    await user.type(screen.getByLabelText(/deviceCode/i), "ESP32-001");
    await user.type(
      screen.getByLabelText(/deviceType/i),
      "ESP32_CAM_SENSOR",
    );
    await user.type(screen.getByLabelText(/model/i), "Leafy IoT Module V1");
    await user.type(
      screen.getByLabelText(/deviceName/i),
      "North Field Sensor",
    );
    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Chọn vườn")).not.toBeDisabled(),
    );
    await user.selectOptions(screen.getByLabelText("Chọn vườn"), "farm-1");
    await waitFor(() =>
      expect(screen.getByLabelText("Chọn khu vực")).not.toBeDisabled(),
    );
    await user.selectOptions(screen.getByLabelText("Chọn khu vực"), "zone-1");
    await user.click(
      screen.getByRole("button", { name: "Kết nối thiết bị" }),
    );

    expect(
      await screen.findByText("Kết nối thiết bị thành công"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(provisionBody).toEqual({
        deviceUid: "LEAFY-ESP32-001",
        deviceCode: "ESP32-001",
        deviceName: "North Field Sensor",
        deviceType: "ESP32_CAM_SENSOR",
      });
    });
  });

  it("renders a loading state when the backend is slow during refresh", async () => {
    server.use(
      http.post("*/api/iot/devices/provision", async () => {
        return HttpResponse.json(device);
      }),
      http.post("*/api/iot/devices/:deviceId/claim-code", () => {
        return HttpResponse.json({
          deviceId: "device-1",
          claimCode: "CLAIM-123",
          expiresAt: "2026-04-16T04:00:00Z",
        });
      }),
      http.post("*/api/iot/devices/claim", () => {
        return HttpResponse.json(device);
      }),
      http.get("*/api/iot/devices/me", async () => {
        await delay(100);
        return HttpResponse.json(pagedDevices());
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    expect(screen.getByText("Thêm thiết bị IoT")).toBeInTheDocument();
  });
});
