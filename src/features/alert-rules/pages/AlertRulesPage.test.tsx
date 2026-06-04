import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AlertRulesPage } from "./AlertRulesPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { AlertRuleResponse, PagedResponse } from "../../../types/iot";

const alertRule: AlertRuleResponse = {
  id: "rule-1",
  sensorTypeId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  deviceId: "11111111-1111-1111-1111-111111111111",
  zoneId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  farmPlotId: "farm-1",
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
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
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
  id: "11111111-1111-1111-1111-111111111111",
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

const sensorReading = {
  sensorTypeId: alertRule.sensorTypeId,
  sensorCode: "AIR_TEMP",
  sensorName: "Air temperature",
  unit: "C",
  value: 44,
  readingTime: "2026-04-16T02:59:00Z",
  qualityStatus: "GOOD",
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

const mockPickerApis = () => {
  server.use(
    http.get("*/api/profiles/me", () =>
      HttpResponse.json({ data: { id: "profile-1", userId: "user-1" } }),
    ),
    http.get("*/api/farms/plots", () => HttpResponse.json([farmPlot])),
    http.get("*/api/farms/zones", () => HttpResponse.json([zone])),
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
    http.get("*/api/iot/devices/:deviceId/latest-readings", () =>
      HttpResponse.json([sensorReading]),
    ),
    http.get("*/api/iot/farm-zones/:zoneId/overview", () =>
      HttpResponse.json({ latestReadings: [sensorReading] }),
    ),
  );
};

const waitForRuleList = () => screen.findByRole("table", { name: "Alert rules" });

const chooseSelectOption = async (
  label: string,
  optionName: string | RegExp,
) => {
  await userEvent.click(screen.getByLabelText(label));
  const options = await screen.findAllByText(optionName);
  const option =
    options.find((element) =>
      String(element.getAttribute("class") ?? "").includes("cursor-pointer"),
    ) ?? options[0];
  await userEvent.click(option);
};

describe("AlertRulesPage", () => {
  it("renders a paged backend alert rule list", async () => {
    mockPickerApis();
    useRulesList();

    renderWithClient(<AlertRulesPage />);

    expect(await waitForRuleList()).toBeInTheDocument();
    expect(screen.getAllByText(/North sensor/).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Coffee Zone A/)).toBeInTheDocument();
    expect(screen.getAllByText(/North Farm/).length).toBeGreaterThan(0);
    expect(screen.getByText("1 quy tắc")).toBeInTheDocument();
    expect(screen.getAllByText("Quan trọng").length).toBeGreaterThan(0);
    expect(screen.getByText("Đang bật")).toBeInTheDocument();
  });

  it("sends alert rule filters in the request", async () => {
    const seenRequests: Array<{
      sensorTypeId: string | null;
      deviceId: string | null;
      zoneId: string | null;
      farmPlotId: string | null;
      enabled: string | null;
    }> = [];

    mockPickerApis();
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

    await waitForRuleList();
    await chooseSelectOption("Filter farm plot", "North Farm");
    await chooseSelectOption("Filter zone", "Coffee Zone A");
    await chooseSelectOption("Filter device", "North sensor");
    await userEvent.type(
      screen.getByLabelText("Advanced filter sensorTypeId"),
      alertRule.sensorTypeId,
    );
    await chooseSelectOption("Filter enabled", "Đang bật");

    await waitFor(() => {
      expect(seenRequests).toContainEqual({
        sensorTypeId: alertRule.sensorTypeId,
        deviceId: device.id,
        zoneId: zone.id,
        farmPlotId: farmPlot.id,
        enabled: "true",
      });
    });
  });

  it("submits a valid create rule payload", async () => {
    let submittedBody: unknown;
    mockPickerApis();
    useRulesList();
    server.use(
      http.post("*/api/iot/alert-rules", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json({ ...alertRule, id: "rule-2" });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await waitForRuleList();
    await userEvent.click(screen.getByRole("button", { name: "Tạo quy tắc" }));
    await chooseSelectOption("Rule farm plot", "North Farm");
    await chooseSelectOption("Rule zone", "Coffee Zone A");
    await chooseSelectOption("Rule device", "North sensor");
    await userEvent.type(
      screen.getByLabelText("Advanced sensorTypeId"),
      alertRule.sensorTypeId,
    );
    await userEvent.type(screen.getByLabelText("Min threshold"), "20");
    await userEvent.type(screen.getByLabelText("Max threshold"), "80");
    await userEvent.clear(screen.getByLabelText("Cooldown minutes"));
    await userEvent.type(screen.getByLabelText("Cooldown minutes"), "10");
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Tạo quy tắc",
      }),
    );

    await waitFor(() => {
      expect(submittedBody).toEqual({
        sensorTypeId: alertRule.sensorTypeId,
        deviceId: device.id,
        zoneId: zone.id,
        farmPlotId: farmPlot.id,
        minThreshold: 20,
        maxThreshold: 80,
        severity: "HIGH",
        cooldownMinutes: 10,
        notifyWeb: true,
        notifyMobile: false,
        enabled: true,
      });
    });
  });

  it("blocks invalid thresholds before submitting", async () => {
    let postCalled = false;
    mockPickerApis();
    useRulesList();
    server.use(
      http.post("*/api/iot/alert-rules", () => {
        postCalled = true;
        return HttpResponse.json(alertRule);
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await waitForRuleList();
    await userEvent.click(screen.getByRole("button", { name: "Tạo quy tắc" }));
    await userEvent.type(screen.getByLabelText("Advanced sensorTypeId"), alertRule.sensorTypeId);
    await chooseSelectOption("Rule device", "North sensor");
    await userEvent.type(screen.getByLabelText("Min threshold"), "40");
    await userEvent.type(screen.getByLabelText("Max threshold"), "30");
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Tạo quy tắc",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ngưỡng thấp phải nhỏ hơn ngưỡng cao.",
    );
    expect(postCalled).toBe(false);
  });

  it("blocks submit without any scope", async () => {
    let postCalled = false;
    mockPickerApis();
    useRulesList();
    server.use(
      http.post("*/api/iot/alert-rules", () => {
        postCalled = true;
        return HttpResponse.json(alertRule);
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await waitForRuleList();
    await userEvent.click(screen.getByRole("button", { name: "Tạo quy tắc" }));
    await userEvent.type(screen.getByLabelText("Advanced sensorTypeId"), alertRule.sensorTypeId);
    await userEvent.type(screen.getByLabelText("Max threshold"), "80");
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Tạo quy tắc",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cần chọn ít nhất một phạm vi: vườn, khu vực hoặc thiết bị.",
    );
    expect(postCalled).toBe(false);
  });

  it("prefills the edit dialog with existing values", async () => {
    mockPickerApis();
    useRulesList();

    renderWithClient(<AlertRulesPage />);

    await waitForRuleList();
    await userEvent.click(screen.getByLabelText(`Edit rule ${alertRule.id}`));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Rule farm plot")).toHaveTextContent("North Farm");
    expect(screen.getByLabelText("Advanced sensorTypeId")).toHaveValue(
      alertRule.sensorTypeId,
    );
  });

  it("omits unchanged scope when updating an existing rule", async () => {
    let submittedBody: Record<string, unknown> | undefined;
    mockPickerApis();
    useRulesList();
    server.use(
      http.put("*/api/iot/alert-rules/:ruleId", async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ ...alertRule, maxThreshold: 42 });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await waitForRuleList();
    await userEvent.click(screen.getByLabelText(`Edit rule ${alertRule.id}`));
    await userEvent.clear(screen.getByLabelText("Max threshold"));
    await userEvent.type(screen.getByLabelText("Max threshold"), "42");
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Lưu quy tắc",
      }),
    );

    await waitFor(() => {
      expect(submittedBody).toMatchObject({
        sensorTypeId: alertRule.sensorTypeId,
        minThreshold: null,
        maxThreshold: 42,
        severity: "HIGH",
        cooldownMinutes: 15,
        notifyWeb: true,
        notifyMobile: false,
        enabled: true,
      });
      expect(submittedBody).not.toHaveProperty("deviceId");
      expect(submittedBody).not.toHaveProperty("zoneId");
      expect(submittedBody).not.toHaveProperty("farmPlotId");
    });
  });

  it("toggles enabled state through the backend mutation", async () => {
    let submittedBody: unknown;
    mockPickerApis();
    useRulesList();
    server.use(
      http.patch("*/api/iot/alert-rules/:ruleId/enabled", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json({ ...alertRule, enabled: false });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    await waitForRuleList();
    await userEvent.click(screen.getByRole("button", { name: "Tắt" }));

    await waitFor(() => {
      expect(submittedBody).toEqual({ enabled: false });
    });
  });

  it("deletes a rule and refetches the list", async () => {
    let deleteCalled = false;
    let getCount = 0;

    mockPickerApis();
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

    await waitForRuleList();
    await userEvent.click(screen.getByLabelText("Delete rule rule-1"));
    expect(screen.getByText("Xóa quy tắc cảnh báo?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận xóa" }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
      expect(getCount).toBeGreaterThan(1);
    });
  });

  it("renders loading, empty, and error states", async () => {
    mockPickerApis();
    server.use(
      http.get("*/api/iot/alert-rules", async () => {
        await delay(100);
        return HttpResponse.json(pagedRules());
      }),
    );

    const { unmount } = renderWithClient(<AlertRulesPage />);

    expect(screen.getByLabelText("Đang tải quy tắc cảnh báo")).toBeInTheDocument();
    unmount();

    useRulesList(pagedRules([]));
    const emptyRender = renderWithClient(<AlertRulesPage />);
    expect(await screen.findByText("Không có quy tắc cảnh báo")).toBeInTheDocument();
    emptyRender.unmount();

    server.use(
      http.get("*/api/iot/alert-rules", () => {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );

    renderWithClient(<AlertRulesPage />);

    expect(
      await screen.findByText("Không tải được quy tắc cảnh báo"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
