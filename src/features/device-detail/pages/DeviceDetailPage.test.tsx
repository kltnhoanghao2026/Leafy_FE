import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { DeviceDetailPage } from "./DeviceDetailPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type {
  ChartRange,
  DeviceConfigResponse,
  DeviceDetailResponse,
} from "../../../types/iot";

const DEVICE_ID = "11111111-1111-1111-1111-111111111111";
const ZONE_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const deviceDetail: DeviceDetailResponse = {
  deviceId: DEVICE_ID,
  deviceUid: "prod-demo-device-1",
  deviceCode: "DEMO-001",
  deviceName: "Demo Zone Sensor Hub",
  deviceType: "ESP32",
  firmwareVersion: "seed-live-1.0",
  status: "ONLINE",
  provisioningStatus: "CLAIMED",
  isActive: true,
  ownerUserId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  farmPlotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  zoneId: ZONE_ID,
  lastSeenAt: "2026-04-16T03:00:00Z",
  alertSummary: {
    openAlerts: 1,
    highSeverityAlerts: 1,
    criticalAlerts: 0,
    latestAlertAt: "2026-04-16T02:59:00Z",
  },
  config: {
    configVersion: 2,
    samplingIntervalSec: 60,
    publishIntervalSec: 300,
    offlineTimeoutSec: 900,
    alertEnabled: true,
    appliedAt: null,
  },
  latestMedia: null,
  latestReadings: [],
};

const latestReadings = [
  {
    sensorTypeId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    sensorCode: "AIR_TEMP",
    sensorName: "Air Temperature",
    unit: "C",
    value: 28.4,
    readingTime: "2026-04-16T03:00:00Z",
    qualityStatus: "GOOD",
  },
];

const baseConfig: DeviceConfigResponse = {
  deviceId: DEVICE_ID,
  configVersion: 2,
  samplingIntervalSec: 60,
  publishIntervalSec: 300,
  offlineTimeoutSec: 900,
  alertEnabled: true,
  appliedAt: null,
  lastPushStatus: null,
  lastAckAt: null,
  lastPushError: null,
};

const chartResponse = (sensorCode: string, rangeType: ChartRange) => ({
  deviceId: DEVICE_ID,
  zoneId: null,
  sensorCode,
  sensorName: sensorCode,
  unit: "C",
  rangeType,
  points: [
    {
      bucketStart: "2026-04-16T02:55:00Z",
      bucketEnd: "2026-04-16T03:00:00Z",
      avgValue: 28.2,
      minValue: 27.9,
      maxValue: 28.6,
      sampleCount: 3,
    },
  ],
});

const renderDevicePage = () =>
  renderWithClient(
    <Routes>
      <Route path="/dashboard/devices/:deviceId" element={<DeviceDetailPage />} />
    </Routes>,
    { route: `/dashboard/devices/${DEVICE_ID}` },
  );

const useDeviceHandlers = ({
  detail = deviceDetail,
  config = baseConfig,
}: {
  detail?: DeviceDetailResponse | null;
  config?: DeviceConfigResponse;
} = {}) => {
  server.use(
    http.get("*/api/iot/devices/:deviceId/detail", () => {
      return HttpResponse.json(detail);
    }),
    http.get("*/api/iot/devices/:deviceId/latest-readings", () => {
      return HttpResponse.json(latestReadings);
    }),
    http.get("*/api/iot/devices/:deviceId/charts", ({ request }) => {
      const url = new URL(request.url);
      const sensorCode = url.searchParams.get("sensorCode") || "AIR_TEMP";
      const rangeType = (url.searchParams.get("range") || "H24") as ChartRange;
      return HttpResponse.json(chartResponse(sensorCode, rangeType));
    }),
    http.get("*/api/iot/devices/:deviceId/config", () => {
      return HttpResponse.json(config);
    }),
    http.put("*/api/iot/devices/:deviceId/config", () => {
      return HttpResponse.json({ ...config, configVersion: 3 });
    }),
    http.post("*/api/iot/devices/:deviceId/config/push", () => {
      return HttpResponse.json({ ...config, lastPushStatus: "SENT" });
    }),
  );
};

describe("DeviceDetailPage", () => {
  it("renders backend device metadata", async () => {
    useDeviceHandlers();

    renderDevicePage();

    expect(await screen.findByText("Demo Zone Sensor Hub")).toBeInTheDocument();
    expect(screen.getByText("DEMO-001 - prod-demo-device-1")).toBeInTheDocument();
    expect(screen.getByText("ESP32")).toBeInTheDocument();
    expect(screen.getByText("seed-live-1.0")).toBeInTheDocument();
    expect(screen.getByText("ONLINE")).toBeInTheDocument();
    expect(screen.getByText("CLAIMED")).toBeInTheDocument();
  });

  it("renders latest readings from the backend response", async () => {
    useDeviceHandlers();

    renderDevicePage();

    expect(await screen.findByText("Air Temperature")).toBeInTheDocument();
    expect(screen.getByText("28.4")).toBeInTheDocument();
    expect(screen.getByText("GOOD")).toBeInTheDocument();
  });

  it("renders device chart data", async () => {
    useDeviceHandlers();

    renderDevicePage();

    expect(await screen.findByText("1 chart points")).toBeInTheDocument();
  });

  it("requests new device chart data when range changes", async () => {
    const requestedRanges: string[] = [];
    useDeviceHandlers();
    server.use(
      http.get("*/api/iot/devices/:deviceId/charts", ({ request }) => {
        const url = new URL(request.url);
        requestedRanges.push(url.searchParams.get("range") || "");
        return HttpResponse.json(
          chartResponse(
            url.searchParams.get("sensorCode") || "AIR_TEMP",
            (url.searchParams.get("range") || "H24") as ChartRange,
          ),
        );
      }),
    );

    renderDevicePage();

    await screen.findByText("Air Temperature");
    await userEvent.click(screen.getByRole("button", { name: "7 days" }));

    await waitFor(() => {
      expect(requestedRanges).toContain("D7");
    });
  });

  it("renders config values from the config query", async () => {
    useDeviceHandlers();

    renderDevicePage();

    expect(await screen.findByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByDisplayValue("300")).toBeInTheDocument();
    expect(screen.getByDisplayValue("900")).toBeInTheDocument();
    expect(screen.getByText("Not pushed")).toBeInTheDocument();
  });

  it("submits a valid config update", async () => {
    let submittedBody: unknown;
    useDeviceHandlers();
    server.use(
      http.put("*/api/iot/devices/:deviceId/config", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json({
          ...baseConfig,
          configVersion: 3,
          samplingIntervalSec: 30,
          publishIntervalSec: 120,
          offlineTimeoutSec: 600,
        });
      }),
      http.get("*/api/iot/devices/:deviceId/config", () => {
        return HttpResponse.json({
          ...baseConfig,
          configVersion: submittedBody ? 3 : 2,
          samplingIntervalSec: submittedBody ? 30 : 60,
          publishIntervalSec: submittedBody ? 120 : 300,
          offlineTimeoutSec: submittedBody ? 600 : 900,
        });
      }),
    );

    renderDevicePage();

    const samplingInput = await screen.findByLabelText("Sampling sec");
    await userEvent.clear(samplingInput);
    await userEvent.type(samplingInput, "30");
    await userEvent.clear(screen.getByLabelText("Publish sec"));
    await userEvent.type(screen.getByLabelText("Publish sec"), "120");
    await userEvent.clear(screen.getByLabelText("Offline timeout sec"));
    await userEvent.type(screen.getByLabelText("Offline timeout sec"), "600");
    await userEvent.click(screen.getByRole("button", { name: /save config/i }));

    await waitFor(() => {
      expect(submittedBody).toEqual({
        samplingIntervalSec: 30,
        publishIntervalSec: 120,
        offlineTimeoutSec: 600,
        alertEnabled: true,
      });
    });
  });

  it("blocks invalid interval updates on the client", async () => {
    let putCalled = false;
    useDeviceHandlers();
    server.use(
      http.put("*/api/iot/devices/:deviceId/config", () => {
        putCalled = true;
        return HttpResponse.json(baseConfig);
      }),
    );

    renderDevicePage();

    const samplingInput = await screen.findByLabelText("Sampling sec");
    await userEvent.clear(samplingInput);
    await userEvent.type(samplingInput, "300");
    await userEvent.clear(screen.getByLabelText("Publish sec"));
    await userEvent.type(screen.getByLabelText("Publish sec"), "60");
    await userEvent.click(screen.getByRole("button", { name: /save config/i }));

    expect(
      await screen.findByText(
        "Publish interval must be greater than or equal to sampling interval.",
      ),
    ).toBeInTheDocument();
    expect(putCalled).toBe(false);
  });

  it("handles config query backend errors gracefully", async () => {
    useDeviceHandlers();
    server.use(
      http.get("*/api/iot/devices/:deviceId/config", () => {
        return HttpResponse.json({ code: 500, message: "boom" }, { status: 500 });
      }),
    );

    renderDevicePage();

    expect(
      await screen.findByText("Device detail could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls backend push endpoint when pushing config", async () => {
    let pushCalled = false;
    let currentConfig = baseConfig;
    useDeviceHandlers();
    server.use(
      http.get("*/api/iot/devices/:deviceId/config", () => {
        return HttpResponse.json(currentConfig);
      }),
      http.post("*/api/iot/devices/:deviceId/config/push", () => {
        pushCalled = true;
        currentConfig = { ...baseConfig, lastPushStatus: "SENT" };
        return HttpResponse.json(currentConfig);
      }),
    );

    renderDevicePage();

    await screen.findByText("Demo Zone Sensor Hub");
    await userEvent.click(screen.getByRole("button", { name: /push config/i }));

    await waitFor(() => {
      expect(pushCalled).toBe(true);
    });
  });

  it("shows push result status after push", async () => {
    let currentConfig = baseConfig;
    useDeviceHandlers();
    server.use(
      http.get("*/api/iot/devices/:deviceId/config", () => {
        return HttpResponse.json(currentConfig);
      }),
      http.post("*/api/iot/devices/:deviceId/config/push", () => {
        currentConfig = { ...baseConfig, lastPushStatus: "SENT" };
        return HttpResponse.json(currentConfig);
      }),
    );

    renderDevicePage();

    await screen.findByText("Demo Zone Sensor Hub");
    await userEvent.click(screen.getByRole("button", { name: /push config/i }));

    expect((await screen.findAllByText("SENT")).length).toBeGreaterThan(0);
    expect(
      screen.getByText("Waiting for device acknowledgement."),
    ).toBeInTheDocument();
  });

  it("renders ACKED config state", async () => {
    useDeviceHandlers({
      config: {
        ...baseConfig,
        lastPushStatus: "ACKED",
        lastAckAt: "2026-04-16T03:04:00Z",
        appliedAt: "2026-04-16T03:04:00Z",
      },
    });

    renderDevicePage();

    expect((await screen.findAllByText("ACKED")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Apr 16, 10:04 AM").length).toBeGreaterThan(0);
  });

  it("renders FAILED config state with lastPushError", async () => {
    useDeviceHandlers({
      config: {
        ...baseConfig,
        lastPushStatus: "FAILED",
        lastPushError: "Device did not acknowledge config version 2.",
      },
    });

    renderDevicePage();

    expect((await screen.findAllByText("FAILED")).length).toBeGreaterThan(0);
    expect(
      screen.getByText("Device did not acknowledge config version 2."),
    ).toBeInTheDocument();
  });

  it("renders loading state", () => {
    server.use(
      http.get("*/api/iot/devices/:deviceId/detail", async () => {
        await delay(100);
        return HttpResponse.json(deviceDetail);
      }),
      http.get("*/api/iot/devices/:deviceId/config", async () => {
        await delay(100);
        return HttpResponse.json(baseConfig);
      }),
      http.get("*/api/iot/devices/:deviceId/latest-readings", () => {
        return HttpResponse.json(latestReadings);
      }),
      http.get("*/api/iot/devices/:deviceId/charts", () => {
        return HttpResponse.json(chartResponse("AIR_TEMP", "H24"));
      }),
    );

    renderDevicePage();

    expect(screen.getByLabelText("Loading device detail")).toBeInTheDocument();
  });

  it("renders not-found state when backend returns no detail", async () => {
    useDeviceHandlers({ detail: null });

    renderDevicePage();

    expect(await screen.findByText("Device not found")).toBeInTheDocument();
  });
});
