import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { DeviceCameraScheduleResponse, DeviceDetailResponse } from "../../../types/iot";
import {
  useDeleteDeviceScheduleMutation,
  useRunScheduledCameraMutation,
  useUpdateDeviceScheduleMutation,
} from "../../admin/iot-camera-schedules/cameraSchedules.queries";
import DeviceCameraSchedulesPage from "./DeviceCameraSchedulesPage";

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

const schedule: DeviceCameraScheduleResponse = {
  id: "schedule-1",
  scheduleId: "schedule-1",
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
  lastMediaEvent: {
    id: "media-1",
    requestId: "request-1",
    deviceId,
    zoneId: null,
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
  },
};

function renderPage() {
  return renderWithClient(
    <Routes>
      <Route path="/devices/:deviceId/camera-schedules" element={<DeviceCameraSchedulesPage />} />
    </Routes>,
    { route: `/devices/${deviceId}/camera-schedules` },
  );
}

function setupHandlers(initial: DeviceCameraScheduleResponse[] = [schedule]) {
  let schedules = initial;
  const calls = {
    create: null as unknown,
    update: null as unknown,
    delete: "",
    runNow: "",
  };

  server.use(
    http.get(`*/api/iot/devices/${deviceId}/detail`, () => HttpResponse.json(device)),
    http.get(`*/api/iot/devices/${deviceUid}/camera/capture-schedule`, () => HttpResponse.json(schedules)),
    http.post("*/api/iot/devices/:deviceUid/camera/capture-schedule", async ({ request }) => {
      calls.create = await request.json();
      const created = {
        ...schedule,
        id: "schedule-2",
        scheduleId: "schedule-2",
        timeOfDay: "08:30:00",
        lastMediaEvent: null,
      };
      schedules = [created, ...schedules];
      return HttpResponse.json(created);
    }),
    http.put("*/api/iot/devices/:deviceUid/camera/capture-schedule/:scheduleId", async ({ params, request }) => {
      calls.update = await request.json();
      schedules = schedules.map((item) =>
        item.id === params.scheduleId ? { ...item, ...(calls.update as object) } : item,
      );
      return HttpResponse.json(schedules.find((item) => item.id === params.scheduleId));
    }),
    http.delete("*/api/iot/devices/:deviceUid/camera/capture-schedule/:scheduleId", ({ params }) => {
      calls.delete = String(params.scheduleId);
      schedules = schedules.filter((item) => item.id !== params.scheduleId);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post("*/api/iot/devices/:deviceUid/camera/run-scheduled/:scheduleId", ({ params }) => {
      calls.runNow = String(params.scheduleId);
      const updated = {
        ...schedule,
        lastRunAt: "2026-05-19T09:00:00Z",
        lastMediaStatus: "COMMAND_SENT",
      };
      schedules = schedules.map((item) => (item.id === params.scheduleId ? updated : item));
      return HttpResponse.json(updated);
    }),
    http.get("*/api/files/presigned-url/:fileId", ({ params }) =>
      HttpResponse.json({
        code: 1000,
        message: "ok",
        data: `https://files.example.test/${String(params.fileId)}.jpg`,
      }),
    ),
  );

  return calls;
}

describe("DeviceCameraSchedulesPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("lists only schedules for the current device with thumbnail and status", async () => {
    setupHandlers();
    renderPage();

    expect(await screen.findByText("Leafy Camera")).toBeInTheDocument();
    expect(await screen.findByText("08:30")).toBeInTheDocument();
    expect(screen.getAllByText("Hang ngay").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tiêu chuẩn/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trung bình/).length).toBeGreaterThan(0);
    expect(await screen.findByRole("img", { name: "Anh chup gan nhat cua thiet bi" })).toHaveAttribute(
      "src",
      "https://files.example.test/file-1.jpg",
    );
    expect(screen.getAllByText(/upload/i).length).toBeGreaterThan(0);
  });

  it("creates a device-scoped schedule", async () => {
    const user = userEvent.setup();
    const calls = setupHandlers();
    renderPage();

    await screen.findByText("08:30");
    await user.click(screen.getAllByRole("button", { name: "Tao lich" })[0]);
    await waitFor(() =>
      expect(calls.create).toMatchObject({
        timeOfDay: "08:30:00",
        recurrence: "DAILY",
        resolution: "VGA",
        quality: "MEDIUM",
      }),
    );
  });

  it("enters edit mode for an existing schedule", async () => {
    const user = userEvent.setup();
    const calls = setupHandlers();
    renderPage();

    await screen.findByText("08:30");
    await user.click(screen.getAllByRole("button", { name: "Sua" })[0]);
    expect(await screen.findByText("Sua lich")).toBeInTheDocument();
    expect(calls.runNow).toBe("");
  });

  it("updates a schedule through the device-scoped React Query hook", async () => {
    const user = userEvent.setup();
    const calls = setupHandlers();

    function UpdateHarness() {
      const mutation = useUpdateDeviceScheduleMutation(deviceUid);
      return (
        <button
          type="button"
          onClick={() =>
            mutation.mutate({
              scheduleId: "schedule-1",
              deviceUid,
              payload: {
                enabled: true,
                timeOfDay: "08:30:00",
                recurrence: "DAILY",
                resolution: "VGA",
                quality: "HIGH",
                uploadEndpoint: "http://file-service/files/upload",
              },
            })
          }
        >
          update
        </button>
      );
    }

    renderWithClient(<UpdateHarness />);
    await user.click(screen.getByRole("button", { name: "update" }));
    await waitFor(() => expect(calls.update).toMatchObject({ quality: "HIGH" }));
  });

  it("runs and deletes schedules through device-scoped React Query hooks", async () => {
    const user = userEvent.setup();
    const calls = setupHandlers();

    function ActionHarness() {
      const runMutation = useRunScheduledCameraMutation(deviceUid);
      const deleteMutation = useDeleteDeviceScheduleMutation(deviceUid);
      return (
        <>
          <button
            type="button"
            onClick={() => runMutation.mutate({ scheduleId: "schedule-1", deviceUid })}
          >
            run
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate({ scheduleId: "schedule-1", deviceUid })}
          >
            delete
          </button>
        </>
      );
    }

    renderWithClient(<ActionHarness />);
    await user.click(screen.getByRole("button", { name: "run" }));
    await waitFor(() => expect(calls.runNow).toBe("schedule-1"));
    await user.click(screen.getByRole("button", { name: "delete" }));
    await waitFor(() => expect(calls.delete).toBe("schedule-1"));
  });

  it("blocks invalid upload endpoint before calling the API", async () => {
    const user = userEvent.setup();
    const calls = setupHandlers([]);
    renderPage();

    await screen.findByText("Leafy Camera");
    await user.type(screen.getByLabelText("Nơi tải ảnh lên"), "ftp://invalid");
    await user.click(screen.getByRole("button", { name: "Tao lich" }));

    expect(await screen.findByText("Upload endpoint phai la URL HTTP hoac HTTPS hop le.")).toBeInTheDocument();
    expect(calls.create).toBeNull();
  });
});
