import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type {
  AlertEventItemResponse,
  DeviceCameraScheduleResponse,
  DeviceConfigResponse,
  DeviceDetailResponse,
  DeviceMediaAnalysisResponse,
  DeviceMediaEventResponse,
  LatestReadingItemResponse,
  PagedResponse,
  SensorChartResponse,
} from "../../../types/iot";
import DeviceDetailPage from "./DeviceDetailPage";

const deviceId = "device-1";
const deviceUid = "leafy-cam-001";

const device: DeviceDetailResponse = {
  deviceId,
  deviceUid,
  deviceCode: "CAM-001",
  deviceName: "Leafy Camera",
  deviceType: "ESP32_CAM",
  firmwareVersion: "1.0.0",
  status: "ONLINE",
  provisioningStatus: "CLAIMED",
  isActive: true,
  ownerUserId: "user-1",
  farmPlotId: "farm-1",
  zoneId: "zone-1",
  lastSeenAt: "2026-05-19T08:00:00Z",
  alertSummary: null,
  config: null,
  latestMedia: null,
  latestReadings: [],
};

const config: DeviceConfigResponse = {
  deviceId,
  configVersion: 1,
  samplingIntervalSec: 60,
  publishIntervalSec: 300,
  offlineTimeoutSec: 900,
  alertEnabled: true,
  appliedAt: null,
  lastPushStatus: null,
  lastAckAt: null,
  lastPushError: null,
};

const analysis: DeviceMediaAnalysisResponse = {
  id: "analysis-1",
  mediaEventId: "media-1",
  alertEventId: "alert-1",
  fileId: "file-1",
  deviceUid,
  requestId: "request-1",
  triggerType: "SCHEDULED",
  status: "DISEASE_DETECTED",
  diseaseDetected: true,
  severity: "HIGH",
  diseaseType: "coffee-rust",
  diseaseName: "coffee-rust",
  confidence: 0.86,
  notes: "Detected",
  fileUrl: "https://files.example.test/file-1.jpg",
  capturedAt: "2026-05-19T08:30:00Z",
  analyzedAt: "2026-05-19T08:31:00Z",
  error: null,
};

const media: DeviceMediaEventResponse = {
  id: "media-1",
  requestId: "request-1",
  deviceId,
  zoneId: "zone-1",
  fileId: "file-1",
  mediaType: "IMAGE",
  triggerType: "SCHEDULED",
  status: "UPLOADED",
  contentType: "image/jpeg",
  sizeBytes: 12345,
  width: 640,
  height: 480,
  error: null,
  requestedAt: "2026-05-19T08:29:00Z",
  commandSentAt: "2026-05-19T08:29:01Z",
  uploadedAt: "2026-05-19T08:30:00Z",
  capturedAt: "2026-05-19T08:30:00Z",
  analysis,
};

const reading: LatestReadingItemResponse = {
  sensorTypeId: "sensor-1",
  sensorCode: "AIR_TEMP",
  sensorName: "Air temperature",
  unit: "°C",
  value: 31,
  readingTime: "2026-05-19T08:30:00Z",
  qualityStatus: "GOOD",
};

const chart: SensorChartResponse = {
  deviceId,
  zoneId: "zone-1",
  sensorCode: "AIR_TEMP",
  sensorName: "Air temperature",
  unit: "°C",
  rangeType: "H24",
  points: [],
};

const schedule: DeviceCameraScheduleResponse = {
  id: "schedule-1",
  deviceId,
  deviceUid,
  enabled: true,
  triggerType: "SCHEDULED",
  timeOfDay: "08:30:00",
  recurrence: "DAILY",
  resolution: "VGA",
  quality: "MEDIUM",
  uploadEndpoint: "http://file-service/files/upload",
  lastRunAt: "2026-05-19T08:30:00Z",
  nextRunAt: "2026-05-20T08:30:00Z",
  lastMediaEvent: media,
};

function renderPage() {
  return renderWithClient(
    <Routes>
      <Route path="/devices/:deviceId" element={<DeviceDetailPage />} />
    </Routes>,
    { route: `/devices/${deviceId}` },
  );
}

interface HandlerOptions {
  detail?: DeviceDetailResponse;
  latestReadings?: LatestReadingItemResponse[];
  mediaEvents?: DeviceMediaEventResponse[];
}

function setupHandlers(options: HandlerOptions = {}) {
  let createSchedulePayload: unknown = null;
  let detectPayload: unknown = null;
  const requestedFileIds: string[] = [];
  const requestedS3Keys: string[] = [];
  const latestReadingZoneIds: Array<string | null> = [];
  const chartZoneIds: Array<string | null> = [];
  const mediaZoneIds: Array<string | null> = [];
  const alertZoneIds: Array<string | null> = [];
  const detailResponse = options.detail ?? device;
  const latestReadings = options.latestReadings ?? [];
  const mediaEvents = options.mediaEvents ?? [media];

  server.use(
    http.get(`*/api/iot/devices/${deviceId}/detail`, () => HttpResponse.json(detailResponse)),
    http.get(`*/api/iot/devices/${deviceId}/latest-readings`, ({ request }) => {
      latestReadingZoneIds.push(new URL(request.url).searchParams.get("zoneId"));
      return HttpResponse.json(latestReadings);
    }),
    http.get(`*/api/iot/devices/${deviceId}/charts`, ({ request }) => {
      chartZoneIds.push(new URL(request.url).searchParams.get("zoneId"));
      return HttpResponse.json(chart);
    }),
    http.get(`*/api/iot/devices/${deviceId}/config`, () => HttpResponse.json(config)),
    http.get(`*/api/iot/devices/${deviceId}/media`, ({ request }) => {
      mediaZoneIds.push(new URL(request.url).searchParams.get("zoneId"));
      return HttpResponse.json(mediaEvents);
    }),
    http.get(`*/api/iot/devices/${deviceUid}/camera/capture-schedule`, () => HttpResponse.json([schedule])),
    http.get("*/api/iot/alert-events", ({ request }) => {
      alertZoneIds.push(new URL(request.url).searchParams.get("zoneId"));
      return HttpResponse.json({
        items: [],
        page: 0,
        size: 100,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      } satisfies PagedResponse<AlertEventItemResponse>);
    }),
    http.get("*/api/files/presigned-url/:fileId", ({ params }) => {
      requestedFileIds.push(String(params.fileId));
      return HttpResponse.json({
        code: 1000,
        message: "ok",
        data: `https://files.example.test/${String(params.fileId)}.jpg`,
      });
    }),
    http.get("*/api/files/s3-key/:s3Key", ({ params }) => {
      requestedS3Keys.push(String(params.s3Key));
      return HttpResponse.json({
        code: 1000,
        message: "ok",
        data: {
          id: "legacy-file-1",
          s3Key: String(params.s3Key),
          originalFileName: "leafy-capture.jpg",
          contentType: "image/jpeg",
          fileType: "IMAGE",
          fileSize: 12345,
          uploadedBy: "system",
          active: true,
          createdAt: "2026-05-19T08:30:00Z",
          lastModifiedAt: "2026-05-19T08:30:00Z",
        },
      });
    }),
    http.post(`*/api/iot/devices/${deviceUid}/camera/capture-schedule`, async ({ request }) => {
      createSchedulePayload = await request.json();
      return HttpResponse.json(schedule);
    }),
    http.post(`*/api/iot/devices/${deviceUid}/camera/detect`, async ({ request }) => {
      detectPayload = await request.json();
      return HttpResponse.json({
        ...analysis,
        status: "PROCESSING",
        diseaseDetected: false,
        alertEventId: null,
      });
    }),
  );

  return {
    getCreateSchedulePayload: () => createSchedulePayload,
    getDetectPayload: () => detectPayload,
    getRequestedFileIds: () => requestedFileIds,
    getRequestedS3Keys: () => requestedS3Keys,
    getLatestReadingZoneIds: () => latestReadingZoneIds,
    getChartZoneIds: () => chartZoneIds,
    getMediaZoneIds: () => mediaZoneIds,
    getAlertZoneIds: () => alertZoneIds,
  };
}

describe("DeviceDetailPage camera media panel", () => {
  it("requests current-zone scoped latest readings, charts, media, and alert events", async () => {
    const handlers = setupHandlers({ latestReadings: [reading] });
    renderPage();

    expect(await screen.findByText("Leafy Camera")).toBeInTheDocument();

    await waitFor(() => {
      expect(handlers.getLatestReadingZoneIds()).toContain("zone-1");
      expect(handlers.getMediaZoneIds()).toContain("zone-1");
      expect(handlers.getAlertZoneIds()).toContain("zone-1");
      expect(handlers.getChartZoneIds()).toContain("zone-1");
    });
  });

  it("does not fallback to embedded device-history latest readings for current-zone sections", async () => {
    setupHandlers({
      detail: {
        ...device,
        latestReadings: [reading],
      },
      latestReadings: [],
      mediaEvents: [],
    });
    renderPage();

    expect(await screen.findByText("Leafy Camera")).toBeInTheDocument();
    expect(
      await screen.findByText("Chưa có dữ liệu cảm biến trong khu vực hiện tại."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Air temperature")).not.toBeInTheDocument();
  });

  it("does not render embedded device-history latest media or alert summary in current-zone sections", async () => {
    const handlers = setupHandlers({
      detail: {
        ...device,
        alertSummary: {
          openAlerts: 99,
          highSeverityAlerts: 99,
          criticalAlerts: 99,
          latestAlertAt: "2026-05-19T08:45:00Z",
        },
        latestMedia: {
          mediaEventId: "media-zone-a",
          fileId: "old-zone-file",
          mediaType: "IMAGE",
          triggerType: "SCHEDULED",
          capturedAt: "2026-05-19T08:40:00Z",
          deviceId,
          zoneId: "zone-a",
        },
      },
      latestReadings: [],
      mediaEvents: [],
    });
    renderPage();

    expect(await screen.findByText("Leafy Camera")).toBeInTheDocument();
    expect(
      await screen.findByText("Chưa có ảnh hoặc chẩn đoán nào trong khu vực hiện tại."),
    ).toBeInTheDocument();
    expect(handlers.getRequestedFileIds()).not.toContain("old-zone-file");
    expect(screen.queryByText("99")).not.toBeInTheDocument();
  });

  it("renders schedule list, thumbnail, analysis status, disease, severity, and alert badge", async () => {
    setupHandlers();
    renderPage();

    expect(await screen.findByText("Leafy Camera")).toBeInTheDocument();
    expect(await screen.findByText(/08:30/)).toBeInTheDocument();
    expect(screen.getAllByText(/Hằng ngày/).length).toBeGreaterThan(0);
    const images = await screen.findAllByRole("img");
    expect(images.some((image) => image.getAttribute("src") === "https://files.example.test/file-1.jpg")).toBe(true);
    expect(screen.getAllByText(/coffee-rust/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quan trọng/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đã tạo cảnh báo").length).toBeGreaterThan(0);
  });

  it("resolves legacy internal file-service media URLs through public presigned URLs", async () => {
    const legacyS3Key = "075ac62d-2b51-4fa6-9540-e0a2dbb3f359-leafy-capture.jpg";
    const handlers = setupHandlers({
      mediaEvents: [
        {
          ...media,
          analysis: {
            ...analysis,
            fileUrl: `http://file-service/internal/files/download/s3-key?s3Key=${legacyS3Key}`,
          },
        },
      ],
    });
    renderPage();

    expect(await screen.findByText("Leafy Camera")).toBeInTheDocument();

    await waitFor(() => {
      expect(handlers.getRequestedS3Keys()).toContain(legacyS3Key);
      expect(handlers.getRequestedFileIds()).toContain("legacy-file-1");
    });

    const images = await screen.findAllByRole("img");
    expect(images.some((image) => image.getAttribute("src") === "https://files.example.test/legacy-file-1.jpg")).toBe(true);
    expect(images.some((image) => image.getAttribute("src")?.includes("file-service/internal"))).toBe(false);
  });

  it("creates a client camera schedule through the device scoped endpoint", async () => {
    const user = userEvent.setup();
    const handlers = setupHandlers();
    renderPage();

    await screen.findByText(/08:30/);
    await user.click(screen.getByRole("button", { name: /^Tạo$/i }));

    await waitFor(() =>
      expect(handlers.getCreateSchedulePayload()).toMatchObject({
        enabled: true,
        timeOfDay: "08:30:00",
        recurrence: "DAILY",
        resolution: "VGA",
        quality: "MEDIUM",
      }),
    );
  });

  it("triggers forced manual analysis for the latest uploaded media", async () => {
    const user = userEvent.setup();
    const handlers = setupHandlers();
    renderPage();

    await screen.findByText("Leafy Camera");
    await user.click(await screen.findByRole("button", { name: /Phân tích ảnh mới nhất/i }));

    await waitFor(() =>
      expect(handlers.getDetectPayload()).toMatchObject({
        mediaEventId: "media-1",
        fileId: "file-1",
        deviceUid,
        force: true,
      }),
    );
  });

  it("updates inline media details from the history item", async () => {
    const user = userEvent.setup();
    setupHandlers();
    renderPage();

    await screen.findByText("Leafy Camera");
    await user.click(await screen.findByRole("button", { name: /coffee-rust - Quan trọng/i }));

    expect(screen.getByText("Phân tích bệnh")).toBeInTheDocument();
    expect(screen.getAllByText(/coffee-rust/i).length).toBeGreaterThan(1);
    expect(screen.getByText(/86%/)).toBeInTheDocument();
    expect(screen.getAllByText("Đã upload").length).toBeGreaterThan(0);
  });
});
