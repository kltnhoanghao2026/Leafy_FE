import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AlertsPage } from "./AlertsPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";

const alertItem = {
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

const pagedResponse = {
  items: [alertItem],
  page: 0,
  size: 20,
  totalItems: 1,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

describe("AlertsPage", () => {
  it("renders a paged backend alert list", async () => {
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json(pagedResponse);
      }),
    );

    renderWithClient(<AlertsPage />);

    expect(
      await screen.findByText("AIR_TEMP exceeded max threshold"),
    ).toBeInTheDocument();
    expect(screen.getByText("THRESHOLD_HIGH - value 44")).toBeInTheDocument();
    expect(screen.getByText("1 alert events")).toBeInTheDocument();
  });

  it("sends severity and status filters in the alert events request", async () => {
    const seenRequests: Array<{ severity: string | null; status: string | null }> = [];

    server.use(
      http.get("*/api/iot/alert-events", ({ request }) => {
        const url = new URL(request.url);
        seenRequests.push({
          severity: url.searchParams.get("severity"),
          status: url.searchParams.get("status"),
        });
        return HttpResponse.json(pagedResponse);
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

  it("shows an empty state when no alerts exist", async () => {
    server.use(
      http.get("*/api/iot/alert-events", () => {
        return HttpResponse.json({
          items: [],
          page: 0,
          size: 20,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        });
      }),
    );

    renderWithClient(<AlertsPage />);

    expect(await screen.findByText("No alert events")).toBeInTheDocument();
  });

  it("shows pagination metadata and requests the next page", async () => {
    const requestedPages: string[] = [];

    server.use(
      http.get("*/api/iot/alert-events", ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page") || "0";
        requestedPages.push(page);

        return HttpResponse.json({
          ...pagedResponse,
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
