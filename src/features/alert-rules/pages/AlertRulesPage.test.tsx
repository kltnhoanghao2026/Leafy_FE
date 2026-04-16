import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AlertRulesPage } from "./AlertRulesPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { AlertRuleResponse, PagedResponse } from "../../../types/iot";

const alertRule: AlertRuleResponse = {
  id: "rule-1",
  sensorTypeId: "AIR_TEMP",
  deviceId: "device-1",
  zoneId: null,
  farmPlotId: null,
  ownerUserId: "user-1",
  minThreshold: null,
  maxThreshold: 38,
  severity: "HIGH",
  cooldownMinutes: 15,
  notifyWeb: true,
  notifyMobile: false,
  enabled: true,
  createdAt: "2026-04-16T02:00:00Z",
  updatedAt: "2026-04-16T03:00:00Z",
};

const pagedRules = (
  items: AlertRuleResponse[] = [alertRule],
): PagedResponse<AlertRuleResponse> => ({
  items,
  page: 0,
  size: 20,
  totalItems: items.length,
  totalPages: items.length ? 1 : 0,
  hasNext: false,
  hasPrevious: false,
});

const useRulesList = (
  response: PagedResponse<AlertRuleResponse> = pagedRules(),
) => {
  server.use(
    http.get("*/api/iot/alert-rules", () => {
      return HttpResponse.json(response);
    }),
  );
};

describe("AlertRulesPage", () => {
  it("renders a paged backend alert rule list", async () => {
    useRulesList();

    renderWithClient(<AlertRulesPage />);

    expect(await screen.findByText("Sensor AIR_TEMP")).toBeInTheDocument();
    expect(screen.getByText("1 alert rules")).toBeInTheDocument();
    expect(screen.getAllByText("HIGH").length).toBeGreaterThan(0);
    expect(screen.getByText("ENABLED")).toBeInTheDocument();
  });

  it("sends alert rule filters in the request", async () => {
    const seenRequests: Array<{
      sensorTypeId: string | null;
      deviceId: string | null;
      zoneId: string | null;
      farmPlotId: string | null;
      enabled: string | null;
    }> = [];

    server.use(
      http.get("*/api/iot/alert-rules", ({ request }) => {
        const url = new URL(request.url);
        seenRequests.push({
          sensorTypeId: url.searchParams.get("sensorTypeId"),
          deviceId: url.searchParams.get("deviceId"),
          zoneId: url.searchParams.get("zoneId"),
          farmPlotId: url.searchParams.get("farmPlotId"),
          enabled: url.searchParams.get("enabled"),
        });
        return HttpResponse.json(pagedRules());
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await screen.findByText("Sensor AIR_TEMP");
    await userEvent.type(screen.getByLabelText("Filter sensor type ID"), "sensor-air");
    await userEvent.type(screen.getByLabelText("Filter device ID"), "device-1");
    await userEvent.type(screen.getByLabelText("Filter zone ID"), "zone-1");
    await userEvent.type(screen.getByLabelText("Filter farm plot ID"), "farm-1");
    await userEvent.selectOptions(screen.getByLabelText("Filter enabled"), "true");

    await waitFor(() => {
      expect(seenRequests).toContainEqual({
        sensorTypeId: "sensor-air",
        deviceId: "device-1",
        zoneId: "zone-1",
        farmPlotId: "farm-1",
        enabled: "true",
      });
    });
  });

  it("submits a valid create rule payload", async () => {
    let submittedBody: unknown;
    useRulesList();
    server.use(
      http.post("*/api/iot/alert-rules", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json({ ...alertRule, id: "rule-2" });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await screen.findByText("Sensor AIR_TEMP");
    await userEvent.type(screen.getByLabelText("Sensor type ID"), "sensor-humidity");
    await userEvent.type(screen.getByLabelText("Device ID"), "device-2");
    await userEvent.type(screen.getByLabelText("Min threshold"), "20");
    await userEvent.type(screen.getByLabelText("Max threshold"), "80");
    await userEvent.selectOptions(screen.getByLabelText("Severity"), "MEDIUM");
    await userEvent.clear(screen.getByLabelText("Cooldown minutes"));
    await userEvent.type(screen.getByLabelText("Cooldown minutes"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Create rule" }));

    await waitFor(() => {
      expect(submittedBody).toEqual({
        sensorTypeId: "sensor-humidity",
        deviceId: "device-2",
        zoneId: null,
        farmPlotId: null,
        minThreshold: 20,
        maxThreshold: 80,
        severity: "MEDIUM",
        cooldownMinutes: 10,
        notifyWeb: true,
        notifyMobile: false,
        enabled: true,
      });
    });
  });

  it("blocks invalid thresholds before submitting", async () => {
    let postCalled = false;
    useRulesList();
    server.use(
      http.post("*/api/iot/alert-rules", () => {
        postCalled = true;
        return HttpResponse.json(alertRule);
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await screen.findByText("Sensor AIR_TEMP");
    await userEvent.type(screen.getByLabelText("Sensor type ID"), "sensor-air");
    await userEvent.type(screen.getByLabelText("Device ID"), "device-1");
    await userEvent.type(screen.getByLabelText("Min threshold"), "40");
    await userEvent.type(screen.getByLabelText("Max threshold"), "30");
    await userEvent.click(screen.getByRole("button", { name: "Create rule" }));

    expect(
      await screen.findByText(
        "Minimum threshold must be lower than maximum threshold.",
      ),
    ).toBeInTheDocument();
    expect(postCalled).toBe(false);
  });

  it("toggles enabled state through the backend mutation", async () => {
    let submittedBody: unknown;
    useRulesList();
    server.use(
      http.patch("*/api/iot/alert-rules/:ruleId/enabled", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json({ ...alertRule, enabled: false });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await screen.findByText("Sensor AIR_TEMP");
    await userEvent.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => {
      expect(submittedBody).toEqual({ enabled: false });
    });
  });

  it("deletes a rule and refetches the list", async () => {
    let deleteCalled = false;
    let getCount = 0;

    server.use(
      http.get("*/api/iot/alert-rules", () => {
        getCount += 1;
        return HttpResponse.json(pagedRules());
      }),
      http.delete("*/api/iot/alert-rules/:ruleId", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await screen.findByText("Sensor AIR_TEMP");
    await userEvent.click(screen.getByLabelText("Delete rule rule-1"));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
      expect(getCount).toBeGreaterThan(1);
    });
  });

  it("renders loading, empty, and error states", async () => {
    server.use(
      http.get("*/api/iot/alert-rules", async () => {
        await delay(100);
        return HttpResponse.json(pagedRules());
      }),
    );

    const { unmount } = renderWithClient(<AlertRulesPage />);

    expect(screen.getByLabelText("Loading alert rules")).toBeInTheDocument();
    unmount();

    useRulesList(pagedRules([]));
    const emptyRender = renderWithClient(<AlertRulesPage />);
    expect(await screen.findByText("No alert rules")).toBeInTheDocument();
    emptyRender.unmount();

    server.use(
      http.get("*/api/iot/alert-rules", () => {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    expect(
      await screen.findByText("Alert rules could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
