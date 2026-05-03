import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AlertsPage } from "./AlertsPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { AlertEventItemResponse } from "../../../types/iot";

const alertItem: AlertEventItemResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  deviceId: "11111111-1111-1111-1111-111111111111",
  zoneId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  sensorTypeId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  alertRuleId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
  alertType: "THRESHOLD_HIGH",
  message: "AIR_TEMP exceeded max threshold",
  severity: "HIGH",
  status: "OPEN",
  triggerValue: 44,
  thresholdMin: null,
  thresholdMax: 38,
  openedAt: "2026-04-16T02:59:00Z",
  acknowledgedAt: null,
  resolvedAt: null,
  pushSent: false,
};

const pagedResponse = (
  items: AlertEventItemResponse[] = [alertItem],
  page = 0,
) => ({
  items,
  page,
  size: 20,
  totalItems: items.length,
  totalPages: items.length ? 1 : 0,
  hasNext: false,
  hasPrevious: false,
});

const farmPlot = {
  id: "farm-1",
  ownerProfileId: "profile-1",
  name: "North Farm",
  code: "NORTH",
  description: null,
  areaM2: 1000,
  addressLine: null,
  provinceCode: null,
  districtCode: null,
  wardCode: null,
  latitude: null,
  longitude: null,
  boundaryGeojson: null,
  status: "ACTIVE",
  createdAt: null,
  lastModifiedAt: null,
};

const zone = {
  id: alertItem.zoneId,
  farmPlotId: farmPlot.id,
  zoneName: "Coffee Zone A",
  zoneCode: "A",
  description: null,
  areaM2: 300,
  soilType: null,
  cropType: null,
  plantingDate: null,
  elevationM: null,
  boundaryGeojson: null,
  status: "ACTIVE",
  createdAt: null,
  lastModifiedAt: null,
};

const device = {
  id: alertItem.deviceId,
  deviceUid: "LEAFY-001",
  deviceCode: "ESP32-001",
  deviceName: "North sensor",
  deviceType: "ESP32_CAM_SENSOR",
  firmwareVersion: null,
  isActive: true,
  status: "ONLINE",
  provisioningStatus: "CLAIMED",
  ownerUserId: "user-1",
  farmPlotId: farmPlot.id,
  zoneId: zone.id,
  lastSeenAt: "2026-04-16T02:55:00Z",
};

const mockPickerApis = () => {
  server.use(
    http.get("*/api/profiles/me", () =>
      HttpResponse.json({ data: { id: "profile-1", userId: "user-1" } }),
    ),
    http.get("*/api/farms/plots", () => HttpResponse.json([farmPlot])),
    http.get("*/api/farms/plots/:plotId/zones", () =>
      HttpResponse.json([zone]),
    ),
    http.get("*/api/iot/devices/me", () =>
      HttpResponse.json({
        items: [device],
        page: 0,
        size: 100,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }),
    ),
  );
};

describe("AlertsPage", () => {
  it("renders a paged backend alert list", async () => {
    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json(pagedResponse());
      }),
    );

    renderWithClient(<AlertsPage />);

    expect(
      await screen.findByText("AIR_TEMP exceeded max threshold"),
    ).toBeInTheDocument();
    expect(screen.getByText("THRESHOLD_HIGH - value 44")).toBeInTheDocument();
    expect(screen.getAllByText("North sensor").length).toBeGreaterThan(0);
    expect(screen.getByText("1 alert events")).toBeInTheDocument();
  });

  it("sends severity and status filters in the alert events request", async () => {
    const seenRequests: Array<{ severity: string | null; status: string | null }> = [];

    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", ({ request }) => {
        const url = new URL(request.url);
        seenRequests.push({
          severity: url.searchParams.get("severity"),
          status: url.searchParams.get("status"),
        });
        return HttpResponse.json(pagedResponse());
      }),
    );

    renderWithClient(<AlertsPage />);

    await screen.findByText("AIR_TEMP exceeded max threshold");
    await userEvent.selectOptions(screen.getByLabelText("Severity"), "HIGH");
    await userEvent.selectOptions(screen.getByLabelText("Status"), "OPEN");

    await waitFor(() => {
      expect(seenRequests).toContainEqual({
        severity: "HIGH",
        status: "OPEN",
      });
    });
  });

  it("sends zone, device, and time filters without sending farmPlotId", async () => {
    const seenRequests: Array<{
      farmPlotId: string | null;
      zoneId: string | null;
      deviceId: string | null;
      from: string | null;
      to: string | null;
    }> = [];

    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", ({ request }) => {
        const url = new URL(request.url);
        seenRequests.push({
          farmPlotId: url.searchParams.get("farmPlotId"),
          zoneId: url.searchParams.get("zoneId"),
          deviceId: url.searchParams.get("deviceId"),
          from: url.searchParams.get("from"),
          to: url.searchParams.get("to"),
        });
        return HttpResponse.json(pagedResponse());
      }),
    );

    renderWithClient(<AlertsPage />);

    await screen.findByText("AIR_TEMP exceeded max threshold");
    await screen.findByRole("option", { name: "North Farm" });
    await userEvent.selectOptions(screen.getByLabelText("Farm plot"), farmPlot.id);
    await userEvent.selectOptions(await screen.findByLabelText("Zone"), zone.id ?? "");
    await userEvent.selectOptions(screen.getByLabelText("Device"), device.id ?? "");
    await userEvent.selectOptions(screen.getByLabelText("Time range"), "24h");

    await waitFor(() => {
      expect(seenRequests).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            farmPlotId: null,
            zoneId: zone.id,
            deviceId: device.id,
          }),
        ]),
      );
      const withTime = seenRequests.find((request) => request.from && request.to);
      expect(withTime).toBeTruthy();
    });
  });

  it("shows an empty state when no alerts exist", async () => {
    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json(pagedResponse([]));
      }),
    );

    renderWithClient(<AlertsPage />);

    expect(await screen.findByText("No alert events")).toBeInTheDocument();
  });

  it("acknowledges an open alert and refreshes the list", async () => {
    let acknowledged = false;

    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json(
          pagedResponse([
            {
              ...alertItem,
              status: acknowledged ? "ACKNOWLEDGED" : "OPEN",
              acknowledgedAt: acknowledged ? "2026-04-16T03:10:00Z" : null,
            },
          ]),
        );
      }),
      http.post(
        "*/api/iot/alert-events/:alertEventId/acknowledge",
        ({ params }) => {
          expect(params.alertEventId).toBe(alertItem.id);
          acknowledged = true;
          return HttpResponse.json({
            ...alertItem,
            status: "ACKNOWLEDGED",
            acknowledgedAt: "2026-04-16T03:10:00Z",
          });
        },
      ),
    );

    renderWithClient(<AlertsPage />);

    await screen.findByText("AIR_TEMP exceeded max threshold");
    await userEvent.click(
      screen.getByRole("button", { name: /acknowledge alert/i }),
    );

    await waitFor(() => {
      expect(screen.getAllByText("ACKNOWLEDGED").length).toBeGreaterThan(1);
    });
    expect(
      screen.getByRole("button", { name: /acknowledge alert/i }),
    ).toBeDisabled();
  });

  it("resolves an acknowledged alert and refreshes the list", async () => {
    let resolved = false;

    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json(
          pagedResponse([
            {
              ...alertItem,
              status: resolved ? "RESOLVED" : "ACKNOWLEDGED",
              acknowledgedAt: "2026-04-16T03:10:00Z",
              resolvedAt: resolved ? "2026-04-16T03:12:00Z" : null,
            },
          ]),
        );
      }),
      http.post("*/api/iot/alert-events/:alertEventId/resolve", ({ params }) => {
        expect(params.alertEventId).toBe(alertItem.id);
        resolved = true;
        return HttpResponse.json({
          ...alertItem,
          status: "RESOLVED",
          acknowledgedAt: "2026-04-16T03:10:00Z",
          resolvedAt: "2026-04-16T03:12:00Z",
        });
      }),
    );

    renderWithClient(<AlertsPage />);

    await screen.findByText("AIR_TEMP exceeded max threshold");
    await userEvent.click(screen.getByRole("button", { name: /resolve alert/i }));

    await waitFor(() => {
      expect(screen.getAllByText("RESOLVED").length).toBeGreaterThan(1);
    });
    expect(screen.getByRole("button", { name: /resolve alert/i })).toBeDisabled();
  });

  it("disables lifecycle actions that are invalid for the alert status", async () => {
    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json(
          pagedResponse([
            {
              ...alertItem,
              status: "RESOLVED",
              acknowledgedAt: "2026-04-16T03:10:00Z",
              resolvedAt: "2026-04-16T03:12:00Z",
            },
          ]),
        );
      }),
    );

    renderWithClient(<AlertsPage />);

    await screen.findByText("AIR_TEMP exceeded max threshold");
    expect(
      screen.getByRole("button", { name: /acknowledge alert/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /resolve alert/i })).toBeDisabled();
  });

  it("shows lifecycle mutation errors gracefully", async () => {
    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json(pagedResponse());
      }),
      http.post("*/api/iot/alert-events/:alertEventId/acknowledge", () => {
        return HttpResponse.json(
          { code: 500, message: "cannot acknowledge" },
          { status: 500 },
        );
      }),
    );

    renderWithClient(<AlertsPage />);

    await screen.findByText("AIR_TEMP exceeded max threshold");
    await userEvent.click(
      screen.getByRole("button", { name: /acknowledge alert/i }),
    );

    expect(
      await screen.findByText("Alert lifecycle action failed"),
    ).toBeInTheDocument();
  });

  it("shows pagination metadata and requests the next page", async () => {
    const requestedPages: string[] = [];

    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page") || "0";
        requestedPages.push(page);

        return HttpResponse.json({
          ...pagedResponse([alertItem], Number(page)),
          page: Number(page),
          totalItems: 2,
          totalPages: 2,
          hasNext: page === "0",
          hasPrevious: page === "1",
        });
      }),
    );

    renderWithClient(<AlertsPage />);

    expect(await screen.findByText(/Page 1 of 2/)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Next page"));

    expect(await screen.findByText(/Page 2 of 2/)).toBeInTheDocument();
    expect(requestedPages).toContain("1");
  });

  it("handles backend error responses gracefully", async () => {
    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json({ code: 500, message: "boom" }, { status: 500 });
      }),
    );

    renderWithClient(<AlertsPage />);

    expect(
      await screen.findByText("Alert events could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
