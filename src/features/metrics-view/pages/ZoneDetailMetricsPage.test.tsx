import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type {
  AlertEventItemResponse,
  DeviceMediaEventResponse,
  DeviceResponse,
  PagedResponse,
  ZoneOverviewResponse,
  SensorChartResponse,
} from "../../../types/iot";
import type { FarmPlotResponse, FarmZoneResponse } from "../../farm-management/types";
import type { ProfileResponse } from "../../settings/types";
import ZoneDetailMetricsPage from "./ZoneDetailMetricsPage";

const zoneId = "zone-b";
const deviceId = "device-1";

const profile: ProfileResponse = {
  id: "profile-1",
  userId: "user-1",
  fullName: "Leafy Farmer",
  profilePicture: null,
  avatar: null,
  role: "FARMER",
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
  email: "farmer@example.test",
  phoneNumber: null,
  createdAt: "2026-05-19T08:00:00Z",
  lastModifiedAt: "2026-05-19T08:00:00Z",
};

const farm: FarmPlotResponse = {
  id: "farm-1",
  ownerProfileId: profile.id,
  name: "Demo Farm",
  code: "FARM",
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
  createdAt: "2026-05-19T08:00:00Z",
  lastModifiedAt: "2026-05-19T08:00:00Z",
};

const zone: FarmZoneResponse = {
  id: zoneId,
  farmPlotId: farm.id,
  ownerProfileId: profile.id,
  zoneName: "Zone B",
  zoneCode: "B",
  description: null,
  areaM2: null,
  soilType: null,
  cropType: null,
  plantingDate: null,
  elevationM: null,
  boundaryGeojson: null,
  status: "ACTIVE",
  createdAt: "2026-05-19T08:00:00Z",
  lastModifiedAt: "2026-05-19T08:00:00Z",
};

const device: DeviceResponse = {
  id: deviceId,
  deviceUid: "leafy-cam-001",
  deviceCode: "CAM-001",
  deviceName: "Leafy Camera",
  deviceType: "ESP32_CAM",
  firmwareVersion: "1.0.0",
  isActive: true,
  status: "ONLINE",
  provisioningStatus: "CLAIMED",
  ownerUserId: "user-1",
  farmPlotId: farm.id,
  zoneId,
  lastSeenAt: "2026-05-19T08:30:00Z",
};

const overview: ZoneOverviewResponse = {
  zoneId,
  openAlerts: 0,
  lastUpdatedAt: "2026-05-19T08:30:00Z",
  alertSummary: null,
  latestMedia: null,
  latestReadings: [],
};

const chart: SensorChartResponse = {
  deviceId: null,
  zoneId,
  sensorCode: "AIR_TEMP",
  sensorName: "Air temperature",
  unit: "°C",
  rangeType: "H24",
  points: [],
};

const zoneMedia: DeviceMediaEventResponse = {
  id: "media-zone-b",
  requestId: "request-zone-b",
  deviceId,
  zoneId,
  fileId: "zone-b-file",
  mediaType: "IMAGE",
  triggerType: "SCHEDULED",
  status: "UPLOADED",
  contentType: "image/jpeg",
  sizeBytes: 12_345,
  width: 640,
  height: 480,
  error: null,
  requestedAt: "2026-05-19T08:29:00Z",
  commandSentAt: "2026-05-19T08:29:01Z",
  uploadedAt: "2026-05-19T08:30:00Z",
  capturedAt: "2026-05-19T08:30:00Z",
  analysis: null,
};

const oldZoneMedia: DeviceMediaEventResponse = {
  ...zoneMedia,
  id: "media-zone-a",
  requestId: "request-zone-a",
  zoneId: "zone-a",
  fileId: "zone-a-file",
};

function renderPage() {
  return renderWithClient(
    <Routes>
      <Route path="/zones/:zoneId" element={<ZoneDetailMetricsPage />} />
    </Routes>,
    { route: `/zones/${zoneId}` },
  );
}

function setupHandlers(options: {
  devices?: DeviceResponse[];
  scopedMedia?: DeviceMediaEventResponse[];
} = {}) {
  const devices = options.devices ?? [device];
  const scopedMedia = options.scopedMedia ?? [];
  const mediaZoneIds: Array<string | null> = [];

  server.use(
    http.get("*/api/profiles/me", () =>
      HttpResponse.json({
        code: 1000,
        message: "ok",
        data: profile,
      }),
    ),
    http.get("*/api/farms/plots", () => HttpResponse.json([farm])),
    http.get("*/api/farms/zones", () => HttpResponse.json([zone])),
    http.get("*/api/iot/devices/me", () =>
      HttpResponse.json({
        items: devices,
        page: 0,
        size: 5,
        totalItems: devices.length,
        totalPages: devices.length > 0 ? 1 : 0,
        hasNext: false,
        hasPrevious: false,
      } satisfies PagedResponse<DeviceResponse>),
    ),
    http.get(`*/api/iot/farm-zones/${zoneId}/overview`, () => HttpResponse.json(overview)),
    http.get(`*/api/iot/farm-zones/${zoneId}/charts`, () => HttpResponse.json(chart)),
    http.get("*/api/iot/alert-events", () =>
      HttpResponse.json({
        items: [],
        page: 0,
        size: 100,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      } satisfies PagedResponse<AlertEventItemResponse>),
    ),
    http.get(`*/api/iot/devices/${deviceId}/media`, ({ request }) => {
      const requestZoneId = new URL(request.url).searchParams.get("zoneId");
      mediaZoneIds.push(requestZoneId);
      return HttpResponse.json(requestZoneId === zoneId ? scopedMedia : [oldZoneMedia]);
    }),
    http.get("*/api/files/presigned-url/:fileId", ({ params }) =>
      HttpResponse.json({
        code: 1000,
        message: "ok",
        data: `https://files.example.test/${String(params.fileId)}.jpg`,
      }),
    ),
  );

  return {
    getMediaZoneIds: () => mediaZoneIds,
  };
}

describe("ZoneDetailMetricsPage media scope", () => {
  it("requests zone-scoped device media with zoneId", async () => {
    const handlers = setupHandlers();
    renderPage();

    expect(await screen.findByText("Zone B (B)")).toBeInTheDocument();

    await waitFor(() => {
      expect(handlers.getMediaZoneIds()).toContain(zoneId);
    });
  });

  it("does not render legacy media from another zone when scoped media is empty", async () => {
    setupHandlers({ scopedMedia: [] });
    renderPage();

    expect(
      (await screen.findAllByText("Chưa có ảnh hoặc chẩn đoán nào trong khu vực này.")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Đã upload")).not.toBeInTheDocument();
  });

  it("renders media returned by the zone-scoped endpoint", async () => {
    setupHandlers({ scopedMedia: [zoneMedia] });
    renderPage();

    expect(await screen.findByText("Đã upload")).toBeInTheDocument();
  });

  it("does not call device media when the zone has no device", async () => {
    const handlers = setupHandlers({ devices: [] });
    renderPage();

    expect(await screen.findByText("Khu vực này chưa có thiết bị camera để chụp ảnh.")).toBeInTheDocument();
    expect(handlers.getMediaZoneIds()).toEqual([]);
  });
});
