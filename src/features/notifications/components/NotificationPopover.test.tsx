import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import { NotificationPopover } from "./NotificationPopover";

const openAlert = {
  id: "alert-1",
  deviceId: "device-1",
  zoneId: "zone-1",
  sensorTypeId: "sensor-1",
  alertRuleId: "rule-1",
  alertType: "THRESHOLD_HIGH",
  message: "Air temperature exceeded max threshold",
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

const pagedAlerts = (totalItems: number, items = totalItems > 0 ? [openAlert] : []) => ({
  items,
  page: 0,
  size: 5,
  totalItems,
  totalPages: totalItems > 0 ? 1 : 0,
  hasNext: false,
  hasPrevious: false,
});

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}{location.search}</span>;
}

const mockPopoverApis = (openAlertCount: number) => {
  server.use(
    http.get("*/api/notifications/state", () =>
      HttpResponse.json({
        data: {
          unreadCount: 0,
          lastCheckedAt: null,
        },
      }),
    ),
    http.get("*/api/notifications/history", () =>
      HttpResponse.json({
        data: [],
      }),
    ),
    http.get("*/api/iot/alert-events", ({ request }) => {
      const url = new URL(request.url);

      expect(url.searchParams.get("status")).toBe("OPEN");
      expect(url.searchParams.get("page")).toBe("0");
      expect(url.searchParams.get("sortBy")).toBe("openedAt");
      expect(url.searchParams.get("sortDir")).toBe("desc");

      const size = url.searchParams.get("size");
      if (size === "1") {
        return HttpResponse.json(pagedAlerts(openAlertCount, []));
      }

      expect(size).toBe("5");
      return HttpResponse.json(pagedAlerts(openAlertCount));
    }),
    http.get("*/api/iot/devices/:deviceId/latest-readings", () =>
      HttpResponse.json([
        {
          sensorTypeId: openAlert.sensorTypeId,
          sensorCode: "AIR_TEMP",
          sensorName: "Air temperature",
          unit: "°C",
          value: openAlert.triggerValue,
          recordedAt: openAlert.openedAt,
          qualityStatus: "GOOD",
        },
      ]),
    ),
  );
};

const openPopover = async () => {
  const bell = screen.getByLabelText("Thông báo");
  fireEvent.mouseEnter(bell.parentElement ?? bell);
  await waitFor(() => {
    expect(bell).toHaveAttribute("aria-expanded", "true");
  });
};

describe("NotificationPopover alert tabs", () => {
  it("renders notification and alert tabs with notifications active by default", async () => {
    mockPopoverApis(0);

    renderWithClient(<NotificationPopover />);

    await openPopover();

    const notificationsTab = await screen.findByRole("tab", { name: "Thông báo" });
    expect(notificationsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Cảnh báo" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("shows the open alert count on the alert tab", async () => {
    mockPopoverApis(47);

    renderWithClient(<NotificationPopover />);

    await openPopover();

    expect(await screen.findByRole("tab", { name: /Cảnh báo\s*47/i })).toBeInTheDocument();
  });

  it("loads recent open alerts when the alert tab is selected", async () => {
    mockPopoverApis(1);

    renderWithClient(<NotificationPopover />);

    await openPopover();
    await userEvent.click(await screen.findByRole("tab", { name: /Cảnh báo/i }));

    expect(await screen.findByText("Vượt ngưỡng cao")).toBeInTheDocument();
    expect(screen.getByText(/Nhiệt độ không khí cao hơn ngưỡng tối đa 38/)).toBeInTheDocument();
    expect(screen.queryByText("Air temperature exceeded max threshold")).not.toBeInTheDocument();
    expect(screen.getByText("Cần xử lý")).toBeInTheDocument();
  });

  it("shows an empty state when no open alerts exist", async () => {
    mockPopoverApis(0);

    renderWithClient(<NotificationPopover />);

    await openPopover();
    await userEvent.click(await screen.findByRole("tab", { name: "Cảnh báo" }));

    expect(await screen.findByText("Không có cảnh báo cần xử lý.")).toBeInTheDocument();
  });

  it("navigates to alerts without changing alert lifecycle", async () => {
    mockPopoverApis(1);

    renderWithClient(
      <>
        <NotificationPopover />
        <LocationProbe />
      </>,
      { route: "/dashboard" },
    );

    await openPopover();
    await userEvent.click(await screen.findByRole("tab", { name: /Cảnh báo/i }));
    await userEvent.click(await screen.findByText("Vượt ngưỡng cao"));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/alerts?status=OPEN&alertId=alert-1");
    });
  });
});
