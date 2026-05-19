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
  PagedResponse,
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

function setupHandlers() {
  let createSchedulePayload: unknown = null;
  let detectPayload: unknown = null;

  server.use(
    http.get(`*/api/iot/devices/${deviceId}/detail`, () => HttpResponse.json(device)),
    http.get(`*/api/iot/devices/${deviceId}/latest-readings`, () => HttpResponse.json([])),
    http.get(`*/api/iot/devices/${deviceId}/config`, () => HttpResponse.json(config)),
    http.get(`*/api/iot/devices/${deviceId}/media`, () => HttpResponse.json([media])),
    http.get("*/api/iot/camera-schedules", () => HttpResponse.json([schedule])),
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
    http.get("*/api/files/presigned-url/:fileId", ({ params }) =>
      HttpResponse.json({
        code: 1000,
        message: "ok",
        data: `https://files.example.test/${String(params.fileId)}.jpg`,
      }),
    ),
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
  };
}

describe("DeviceDetailPage camera media panel", () => {
  it("renders schedule list, thumbnail, analysis status, disease, severity, and alert badge", async () => {
    setupHandlers();
    renderPage();

    expect(await screen.findByText("Leafy Camera")).toBeInTheDocument();
    expect(screen.getByText(/08:30:00/)).toBeInTheDocument();
    expect(screen.getByText(/DAILY/)).toBeInTheDocument();
    const images = await screen.findAllByRole("img");
    expect(images.some((image) => image.getAttribute("src") === "https://files.example.test/file-1.jpg")).toBe(true);
    expect(screen.getByText(/coffee-rust/i)).toBeInTheDocument();
    expect(screen.getAllByText(/HIGH/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Alert")).toBeInTheDocument();
  });

  it("creates a client camera schedule through the device scoped endpoint", async () => {
    const user = userEvent.setup();
    const handlers = setupHandlers();
    renderPage();

    await screen.findByText("Leafy Camera");
    await user.click(screen.getByRole("button", { name: /^Tao$/i }));

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
    await user.click(screen.getByRole("button", { name: /Trigger Analysis/i }));

    await waitFor(() =>
      expect(handlers.getDetectPayload()).toMatchObject({
        mediaEventId: "media-1",
        fileId: "file-1",
        deviceUid,
        force: true,
      }),
    );
  });
});
