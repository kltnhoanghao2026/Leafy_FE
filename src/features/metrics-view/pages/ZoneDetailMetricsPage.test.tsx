import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ZoneDetailMetricsPage } from "./ZoneDetailMetricsPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { ChartRange } from "../../../types/iot";

const ZONE_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const zoneOverview = {
  zoneId: ZONE_ID,
  openAlerts: 1,
  lastUpdatedAt: "2026-04-16T03:00:00Z",
  alertSummary: {
    openAlerts: 1,
    highSeverityAlerts: 1,
    criticalAlerts: 0,
    latestAlertAt: "2026-04-16T02:59:00Z",
  },
  latestMedia: null,
  latestReadings: [
    {
      sensorTypeId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      sensorCode: "AIR_TEMP",
      sensorName: "Air Temperature",
      unit: "C",
      value: 28.4,
      readingTime: "2026-04-16T03:00:00Z",
      qualityStatus: "GOOD",
    },
  ],
};

const chartResponse = (sensorCode: string, rangeType: ChartRange) => ({
  deviceId: null,
  zoneId: ZONE_ID,
  sensorCode,
  sensorName: sensorCode,
  unit: sensorCode === "AIR_TEMP" ? "C" : "%",
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
    {
      bucketStart: "2026-04-16T03:00:00Z",
      bucketEnd: "2026-04-16T03:05:00Z",
      avgValue: 28.4,
      minValue: 28,
      maxValue: 29,
      sampleCount: 4,
    },
  ],
});

const renderZonePage = () =>
  renderWithClient(
    <Routes>
      <Route path="/dashboard/metrics/:zoneId" element={<ZoneDetailMetricsPage />} />
    </Routes>,
    { route: `/dashboard/metrics/${ZONE_ID}` },
  );

const useSuccessfulZoneHandlers = (overview = zoneOverview) => {
  server.use(
    http.get("*/api/iot/farm-zones/:zoneId/overview", () => {
      return HttpResponse.json(overview);
    }),
    http.get("*/api/iot/farm-zones/:zoneId/charts", ({ request }) => {
      const url = new URL(request.url);
      const sensorCode = url.searchParams.get("sensorCode") || "AIR_TEMP";
      const rangeType = (url.searchParams.get("range") || "H24") as ChartRange;
      return HttpResponse.json(chartResponse(sensorCode, rangeType));
    }),
    http.get("*/api/iot/alert-events", () => {
      return HttpResponse.json({
        items: [],
        page: 0,
        size: 3,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
    }),
  );
};

describe("ZoneDetailMetricsPage", () => {
  it("renders latest readings from the backend zone overview", async () => {
    useSuccessfulZoneHandlers();

    renderZonePage();

    expect(await screen.findByText("Air Temperature")).toBeInTheDocument();
    expect(screen.getByText("28.4")).toBeInTheDocument();
    expect(screen.getByText("GOOD")).toBeInTheDocument();
  });

  it("renders zone chart data from backend chart queries", async () => {
    useSuccessfulZoneHandlers();

    renderZonePage();

    const chartPointLabels = await screen.findAllByText("2 chart points");
    expect(chartPointLabels.length).toBeGreaterThan(0);
  });

  it("requests new chart data when the range changes", async () => {
    const requestedRanges: string[] = [];
    useSuccessfulZoneHandlers();
    server.use(
      http.get("*/api/iot/farm-zones/:zoneId/charts", ({ request }) => {
        const url = new URL(request.url);
        const sensorCode = url.searchParams.get("sensorCode") || "AIR_TEMP";
        const rangeType = (url.searchParams.get("range") || "H24") as ChartRange;
        if (sensorCode === "AIR_TEMP") {
          requestedRanges.push(rangeType);
        }
        return HttpResponse.json(chartResponse(sensorCode, rangeType));
      }),
    );

    renderZonePage();

    await screen.findByText("Air Temperature");
    await userEvent.click(screen.getByRole("button", { name: "7d" }));

    await waitFor(() => {
      expect(requestedRanges).toContain("D7");
    });
  });

  it("shows an empty state when the zone has no latest readings or chart points", async () => {
    server.use(
      http.get("*/api/iot/farm-zones/:zoneId/overview", () => {
        return HttpResponse.json({ ...zoneOverview, latestReadings: [] });
      }),
      http.get("*/api/iot/farm-zones/:zoneId/charts", ({ request }) => {
        const url = new URL(request.url);
        const sensorCode = url.searchParams.get("sensorCode") || "AIR_TEMP";
        return HttpResponse.json({
          ...chartResponse(sensorCode, "H24"),
          points: [],
        });
      }),
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json({
          items: [],
          page: 0,
          size: 3,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        });
      }),
    );

    renderZonePage();

    expect(await screen.findByText("No latest sensor readings")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("No chart data")).toHaveLength(4);
    });
  });

  it("shows an error state when zone overview fails", async () => {
    server.use(
      http.get("*/api/iot/farm-zones/:zoneId/overview", () => {
        return HttpResponse.json({ code: 500, message: "boom" }, { status: 500 });
      }),
    );

    renderZonePage();

    expect(
      await screen.findByText("Zone overview could not be loaded"),
    ).toBeInTheDocument();
  });
});
