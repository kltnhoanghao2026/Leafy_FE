import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import { IotCameraSchedulesPage } from "./IotCameraSchedulesPage";
import type { DeviceCameraScheduleResponse } from "../../../types/iot";

const schedule: DeviceCameraScheduleResponse = {
  id: "schedule-1",
  deviceId: "device-1",
  deviceUid: "leafy-cam-001",
  enabled: true,
  triggerType: "SCHEDULED",
  timeOfDay: "08:30:00",
  recurrence: "DAILY",
  resolution: "VGA",
  quality: "MEDIUM",
  uploadEndpoint: "http://file-service/files/upload",
  lastRunAt: "2026-05-15T01:00:00Z",
  nextRunAt: "2026-05-16T01:30:00Z",
  lastMediaEvent: {
    id: "media-1",
    requestId: "request-1",
    deviceId: "device-1",
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
    requestedAt: "2026-05-15T01:00:00Z",
    commandSentAt: "2026-05-15T01:00:01Z",
    uploadedAt: "2026-05-15T01:00:05Z",
    capturedAt: "2026-05-15T01:00:05Z",
  },
};

function useScheduleHandlers(initial: DeviceCameraScheduleResponse[] = [schedule]) {
  let schedules = initial;
  let runNowCalled = false;

  server.use(
    http.get("*/api/iot/camera-schedules", () => HttpResponse.json(schedules)),
    http.post("*/api/iot/camera-schedules/:scheduleId/run-now", ({ params }) => {
      runNowCalled = true;
      schedules = schedules.map((item) =>
        item.id === params.scheduleId
          ? {
              ...item,
              lastRunAt: "2026-05-15T02:00:00Z",
              lastMediaEvent: {
                ...item.lastMediaEvent!,
                id: "media-2",
                requestId: "request-2",
                status: "COMMAND_SENT",
                fileId: null,
                uploadedAt: null,
                capturedAt: "2026-05-15T02:00:00Z",
              },
            }
          : item,
      );
      return HttpResponse.json(schedules[0]);
    }),
    http.post("*/api/admin/camera/run-scheduled/:deviceUid", ({ params }) => {
      runNowCalled = true;
      schedules = schedules.map((item) =>
        item.deviceUid === params.deviceUid
          ? {
              ...item,
              lastRunAt: "2026-05-15T02:00:00Z",
              lastMediaEvent: {
                ...item.lastMediaEvent!,
                id: "media-2",
                requestId: "request-2",
                status: "COMMAND_SENT",
                fileId: null,
                uploadedAt: null,
                capturedAt: "2026-05-15T02:00:00Z",
              },
            }
          : item,
      );
      return HttpResponse.json(schedules[0]);
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
    wasRunNowCalled: () => runNowCalled,
  };
}

describe("IotCameraSchedulesPage", () => {
  it("renders and lists camera schedules with thumbnail metadata", async () => {
    useScheduleHandlers();

    renderWithClient(<IotCameraSchedulesPage />, {
      route: "/admin/iot-camera-schedules",
    });

    expect(await screen.findByText(/Thiết bị leafy-ca\.\.\.-001/)).toBeInTheDocument();
    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getAllByText("Hang ngay").length).toBeGreaterThan(0);
    expect(await screen.findByRole("img", { name: "Anh chup gan nhat cua thiet bi" })).toHaveAttribute(
      "src",
      "https://files.example.test/file-1.jpg",
    );
    expect(screen.getByText(/640x480/)).toBeInTheDocument();
    expect(screen.getAllByText(/Tiêu chuẩn/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trung bình/).length).toBeGreaterThan(0);
  });

  it("runs schedule now and refreshes the displayed capture status", async () => {
    const user = userEvent.setup();
    const handlers = useScheduleHandlers();

    renderWithClient(<IotCameraSchedulesPage />, {
      route: "/admin/iot-camera-schedules",
    });

    await screen.findByText(/Thiết bị leafy-ca\.\.\.-001/);
    await user.click(screen.getByRole("button", { name: /Chay chup theo thiet bi/i }));

    await waitFor(() => expect(handlers.wasRunNowCalled()).toBe(true));
    expect(await screen.findByText("Đã gửi lệnh")).toBeInTheDocument();
    expect(screen.queryByText("request-2")).not.toBeInTheDocument();
  });

  it("filters schedules by device UID and enabled state", async () => {
    useScheduleHandlers([
      schedule,
      {
        ...schedule,
        id: "schedule-2",
        deviceUid: "disabled-cam",
        enabled: false,
        lastMediaEvent: null,
      },
    ]);

    const user = userEvent.setup();
    renderWithClient(<IotCameraSchedulesPage />, {
      route: "/admin/iot-camera-schedules",
    });

    await screen.findByText(/Thiết bị leafy-ca\.\.\.-001/);
    await user.type(screen.getByPlaceholderText("Lọc theo thiết bị"), "disabled");

    expect(screen.queryByText(/Thiết bị leafy-ca\.\.\.-001/)).not.toBeInTheDocument();
    expect(screen.getByText(/disabled-cam/)).toBeInTheDocument();

    await user.selectOptions(screen.getByDisplayValue("Tat ca lich"), "enabled");
    expect(screen.queryByText("disabled-cam")).not.toBeInTheDocument();
  });
});
