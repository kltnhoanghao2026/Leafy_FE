import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { DeviceOnboardingPage } from "./DeviceOnboardingPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type { DeviceResponse, PagedResponse } from "../../../types/iot";

const device: DeviceResponse = {
  id: "device-1",
  deviceUid: "uid-1",
  deviceCode: "DEV-001",
  deviceName: "North Field Sensor",
  deviceType: "ESP32",
  firmwareVersion: "1.0.0",
  isActive: true,
  status: "ONLINE",
  provisioningStatus: "CLAIMED",
  ownerUserId: "user-1",
  farmPlotId: "farm-1",
  zoneId: "zone-1",
  lastSeenAt: "2026-04-16T03:00:00Z",
};

const pagedDevices = (
  items: DeviceResponse[] = [device],
  page = 0,
): PagedResponse<DeviceResponse> => ({
  items,
  page,
  size: 20,
  totalItems: items.length,
  totalPages: items.length ? 2 : 0,
  hasNext: items.length > 0 && page === 0,
  hasPrevious: page > 0,
});

const useMyDevicesList = (
  response: PagedResponse<DeviceResponse> = pagedDevices(),
) => {
  server.use(
    http.get("*/api/iot/devices/me", () => {
      return HttpResponse.json(response);
    }),
  );
};

describe("DeviceOnboardingPage", () => {
  it("submits a valid provision payload", async () => {
    let submittedBody: unknown;
    useMyDevicesList();
    server.use(
      http.post("*/api/iot/devices/provision", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json(device);
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    await screen.findByText("North Field Sensor");
    await userEvent.type(screen.getAllByLabelText("Device UID")[0], " uid-2 ");
    await userEvent.type(screen.getByLabelText("Device code"), " DEV-002 ");
    await userEvent.type(screen.getByLabelText("Device name"), " South Sensor ");
    await userEvent.clear(screen.getByLabelText("Device type"));
    await userEvent.type(screen.getByLabelText("Device type"), " ESP32 ");
    await userEvent.click(screen.getByRole("button", { name: "Provision" }));

    await waitFor(() => {
      expect(submittedBody).toEqual({
        deviceUid: "uid-2",
        deviceCode: "DEV-002",
        deviceName: "South Sensor",
        deviceType: "ESP32",
      });
    });
  });

  it("surfaces duplicate or backend validation errors", async () => {
    useMyDevicesList();
    server.use(
      http.post("*/api/iot/devices/provision", () => {
        return HttpResponse.json(
          { message: "duplicate device UID" },
          { status: 409 },
        );
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    await screen.findByText("North Field Sensor");
    await userEvent.type(screen.getAllByLabelText("Device UID")[0], "uid-1");
    await userEvent.type(screen.getByLabelText("Device code"), "DEV-001");
    await userEvent.type(screen.getByLabelText("Device name"), "Sensor");
    await userEvent.click(screen.getByRole("button", { name: "Provision" }));

    expect(
      await screen.findByText(
        /Device onboarding request failed. Check for duplicate IDs/i,
      ),
    ).toBeInTheDocument();
  });

  it("generates and displays a claim code", async () => {
    useMyDevicesList();
    server.use(
      http.post("*/api/iot/devices/:deviceId/claim-code", () => {
        return HttpResponse.json({
          deviceId: "device-1",
          claimCode: "CLAIM-123",
          expiresAt: "2026-04-16T04:00:00Z",
        });
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    await screen.findByText("North Field Sensor");
    await userEvent.type(screen.getByLabelText("Device ID for claim code"), "device-1");
    await userEvent.click(
      screen.getByRole("button", { name: /generate claim code/i }),
    );

    expect(await screen.findByText("CLAIM-123")).toBeInTheDocument();
    expect(screen.getByText(/Expires/)).toBeInTheDocument();
  });

  it("submits a valid claim payload", async () => {
    let submittedBody: unknown;
    useMyDevicesList();
    server.use(
      http.post("*/api/iot/devices/claim", async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json(device);
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    await screen.findByText("North Field Sensor");
    await userEvent.type(screen.getAllByLabelText("Device UID")[1], "uid-1");
    await userEvent.type(screen.getByLabelText("Claim code"), "CLAIM-123");
    await userEvent.type(screen.getByLabelText("Farm plot ID"), "farm-1");
    await userEvent.type(screen.getByLabelText("Zone ID"), "zone-1");
    await userEvent.click(screen.getByRole("button", { name: "Claim device" }));

    await waitFor(() => {
      expect(submittedBody).toEqual({
        deviceUid: "uid-1",
        claimCode: "CLAIM-123",
        farmPlotId: "farm-1",
        zoneId: "zone-1",
      });
    });
  });

  it("renders backend-owned devices", async () => {
    useMyDevicesList();

    renderWithClient(<DeviceOnboardingPage />);

    expect(await screen.findByText("North Field Sensor")).toBeInTheDocument();
    expect(screen.getByText("DEV-001 - uid-1")).toBeInTheDocument();
    expect(screen.getAllByText("ONLINE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CLAIMED").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Detail" })).toHaveAttribute(
      "href",
      "/dashboard/devices/device-1",
    );
  });

  it("sends my-device filters and pagination in the request", async () => {
    const seenRequests: Array<{
      keyword: string | null;
      status: string | null;
      provisioningStatus: string | null;
      page: string | null;
    }> = [];

    server.use(
      http.get("*/api/iot/devices/me", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") || "0");
        seenRequests.push({
          keyword: url.searchParams.get("keyword"),
          status: url.searchParams.get("status"),
          provisioningStatus: url.searchParams.get("provisioningStatus"),
          page: url.searchParams.get("page"),
        });
        return HttpResponse.json(pagedDevices([device], page));
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    await screen.findByText("North Field Sensor");
    await userEvent.type(screen.getByLabelText("Device keyword"), "north");
    await userEvent.selectOptions(screen.getByLabelText("Device status"), "ONLINE");
    await userEvent.selectOptions(
      screen.getByLabelText("Provisioning status"),
      "CLAIMED",
    );
    await userEvent.click(screen.getByLabelText("Next devices page"));

    await waitFor(() => {
      expect(seenRequests).toContainEqual({
        keyword: "north",
        status: "ONLINE",
        provisioningStatus: "CLAIMED",
        page: "1",
      });
    });
  });

  it("renders loading, empty, and error states", async () => {
    server.use(
      http.get("*/api/iot/devices/me", async () => {
        await delay(100);
        return HttpResponse.json(pagedDevices());
      }),
    );

    const { unmount } = renderWithClient(<DeviceOnboardingPage />);

    expect(screen.getByLabelText("Loading my devices")).toBeInTheDocument();
    unmount();

    useMyDevicesList(pagedDevices([]));
    const emptyRender = renderWithClient(<DeviceOnboardingPage />);
    expect(await screen.findByText("No devices")).toBeInTheDocument();
    emptyRender.unmount();

    server.use(
      http.get("*/api/iot/devices/me", () => {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );

    renderWithClient(<DeviceOnboardingPage />);

    expect(
      await screen.findByText("My devices could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
