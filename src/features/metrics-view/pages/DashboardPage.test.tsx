import { screen } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { FARM_PLOT_STORAGE_KEY } from "../config";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";

const FARM_PLOT_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const dashboardOverview = {
  farmPlotId: FARM_PLOT_ID,
  totalDevices: 3,
  onlineDevices: 2,
  offlineDevices: 1,
  totalZones: 2,
  openAlerts: 4,
  lastUpdatedAt: "2026-04-16T03:00:00Z",
};

describe("DashboardPage", () => {
  it("renders dashboard overview from backend data", async () => {
    window.localStorage.setItem(FARM_PLOT_STORAGE_KEY, FARM_PLOT_ID);

    server.use(
      http.get("*/api/iot/dashboard/overview", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("farmPlotId")).toBe(FARM_PLOT_ID);
        return HttpResponse.json(dashboardOverview);
      }),
    );

    renderWithClient(<DashboardPage />);

    expect(await screen.findByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText("1 offline")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Backend-driven monitoring")).toBeInTheDocument();
  });

  it("shows a loading state while dashboard overview is pending", () => {
    window.localStorage.setItem(FARM_PLOT_STORAGE_KEY, FARM_PLOT_ID);

    server.use(
      http.get("*/api/iot/dashboard/overview", async () => {
        await delay(100);
        return HttpResponse.json(dashboardOverview);
      }),
    );

    renderWithClient(<DashboardPage />);

    expect(screen.getByLabelText("Loading dashboard overview")).toBeInTheDocument();
  });

  it("shows an error state with retry when dashboard overview fails", async () => {
    window.localStorage.setItem(FARM_PLOT_STORAGE_KEY, FARM_PLOT_ID);

    server.use(
      http.get("*/api/iot/dashboard/overview", () => {
        return HttpResponse.json({ code: 500, message: "boom" }, { status: 500 });
      }),
    );

    renderWithClient(<DashboardPage />);

    expect(
      await screen.findByText("Dashboard data could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
