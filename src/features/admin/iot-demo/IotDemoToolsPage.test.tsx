import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { IotDemoToolsPage } from "./IotDemoToolsPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";

const BASE_URL = "*/iot-test-data";

function statusHandler(response = { running: false, status: "STOPPED" }) {
  return http.get(`${BASE_URL}/seed/simulation/status`, () =>
    HttpResponse.json(response),
  );
}

function renderPage() {
  server.use(statusHandler());
  return renderWithClient(<IotDemoToolsPage />, {
    route: "/admin/iot-demo-tools",
  });
}

function section(name: string) {
  const heading = screen.getByRole("heading", { name });
  const card = heading.closest("section");
  if (!card) throw new Error(`Section not found: ${name}`);
  return within(card);
}

describe("IotDemoToolsPage", () => {
  it("renders the warning banner", async () => {
    renderPage();

    expect(screen.getByText("Dev/admin-only tool")).toBeInTheDocument();
    expect(
      screen.getByText(/Actions mutate IoT demo data/i),
    ).toBeInTheDocument();
    await screen.findByText("Stopped");
  });

  it("requests simulation status from the test-data service URL", async () => {
    let requested = false;
    server.use(
      http.get(`${BASE_URL}/seed/simulation/status`, () => {
        requested = true;
        return HttpResponse.json({ running: true, status: "RUNNING" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    await screen.findByText("Running");
    expect(requested).toBe(true);
  });

  it("calls bootstrap minimal and displays latest response JSON", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/bootstrap/minimal`, () => {
        called = true;
        return HttpResponse.json({ message: "minimal complete" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    await user.click(screen.getByRole("button", { name: "Bootstrap minimal" }));

    await waitFor(() => expect(called).toBe(true));
    expect(await screen.findByText(/minimal complete/)).toBeInTheDocument();
  });

  it("calls bootstrap full", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/bootstrap/full`, () => {
        called = true;
        return HttpResponse.json({ message: "full complete" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    await user.click(screen.getByRole("button", { name: "Bootstrap full" }));

    await waitFor(() => expect(called).toBe(true));
  });

  it("calls seed history 7d", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/history/last-7d`, () => {
        called = true;
        return HttpResponse.json({ message: "history 7d complete" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    await user.click(screen.getByRole("button", { name: "Seed last 7 days" }));

    await waitFor(() => expect(called).toBe(true));
  });

  it("calls start simulation", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/simulation/start`, () => {
        called = true;
        return HttpResponse.json({ running: true, status: "RUNNING" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    await user.click(screen.getByRole("button", { name: /Start simulation/ }));

    await waitFor(() => expect(called).toBe(true));
  });

  it("calls stop simulation", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      statusHandler({ running: true, status: "RUNNING" }),
      http.post(`${BASE_URL}/seed/simulation/stop`, () => {
        called = true;
        return HttpResponse.json({ running: false, status: "STOPPED" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    await user.click(screen.getByRole("button", { name: /Stop simulation/ }));

    await waitFor(() => expect(called).toBe(true));
  });

  it("displays error response from test-data service", async () => {
    const user = userEvent.setup();
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/bootstrap/minimal`, () =>
        HttpResponse.json({ message: "collector unavailable" }, { status: 503 }),
      ),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    await user.click(screen.getByRole("button", { name: "Bootstrap minimal" }));

    expect(await screen.findByText(/collector unavailable/)).toBeInTheDocument();
  });

  it("renders quick links", async () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      screen.getByRole("link", { name: "Device onboarding" }),
    ).toHaveAttribute("href", "/dashboard/devices/onboarding");
    expect(screen.getByRole("link", { name: "Alert Center" })).toHaveAttribute(
      "href",
      "/dashboard/alerts",
    );
    expect(screen.getByRole("link", { name: "Alert Rules" })).toHaveAttribute(
      "href",
      "/dashboard/alert-rules",
    );
    await screen.findByText("Stopped");
  });

  it("renders anomaly form defaults", async () => {
    renderPage();

    const card = section("Alert anomaly scenarios");
    expect(card.getByLabelText("Device UID")).toHaveValue(
      "prod-minimal-device-1",
    );
    expect(card.getByLabelText("Count")).toHaveValue(5);
    expect(card.getByLabelText("High temperature target")).toHaveValue(44);
    expect(card.getByLabelText("Low soil moisture target")).toHaveValue(8);
    expect(
      card.getByText(/Default device UID works for minimal seed/i),
    ).toBeInTheDocument();
    await screen.findByText("Stopped");
  });

  it("calls high temperature scenario with expected JSON", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/scenarios/high-temperature`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ scenario: "high-temperature" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    const card = section("Alert anomaly scenarios");
    await user.clear(card.getByLabelText("Device UID"));
    await user.type(card.getByLabelText("Device UID"), "demo-device-1");
    await user.clear(card.getByLabelText("Count"));
    await user.type(card.getByLabelText("Count"), "3");
    await user.clear(card.getByLabelText("High temperature target"));
    await user.type(card.getByLabelText("High temperature target"), "45.5");
    await user.click(
      card.getByRole("button", { name: "Trigger high temperature" }),
    );

    await waitFor(() =>
      expect(body).toEqual({
        deviceUid: "demo-device-1",
        count: 3,
        targetValue: 45.5,
      }),
    );
    expect(await screen.findByText(/high-temperature/)).toBeInTheDocument();
  });

  it("calls low soil moisture scenario with expected JSON", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/scenarios/low-soil-moisture`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ scenario: "low-soil-moisture" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    const card = section("Alert anomaly scenarios");
    await user.clear(card.getByLabelText("Device UID"));
    await user.type(card.getByLabelText("Device UID"), "demo-device-2");
    await user.clear(card.getByLabelText("Count"));
    await user.type(card.getByLabelText("Count"), "4");
    await user.clear(card.getByLabelText("Low soil moisture target"));
    await user.type(card.getByLabelText("Low soil moisture target"), "16");
    await user.click(
      card.getByRole("button", { name: "Trigger low soil moisture" }),
    );

    await waitFor(() =>
      expect(body).toEqual({
        deviceUid: "demo-device-2",
        count: 4,
        targetValue: 16,
      }),
    );
  });

  it("calls config ACK success with expected JSON", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/scenarios/config-ack-success`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, configVersion: 7 });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    const card = section("Config ACK scenarios");
    await user.clear(card.getByLabelText("Device UID"));
    await user.type(card.getByLabelText("Device UID"), "demo-device-3");
    await user.click(card.getByRole("button", { name: "Send ACK success" }));

    await waitFor(() =>
      expect(body).toEqual({
        deviceUid: "demo-device-3",
      }),
    );
  });

  it("calls config ACK failure with expected JSON including error message", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/scenarios/config-ack-failure`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          success: false,
          errorMessage: "bad config",
        });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    const card = section("Config ACK scenarios");
    await user.clear(card.getByLabelText("Device UID"));
    await user.type(card.getByLabelText("Device UID"), "demo-device-4");
    await user.type(card.getByLabelText("Config version"), "8");
    await user.clear(card.getByLabelText("Error"));
    await user.type(card.getByLabelText("Error"), "bad config");
    await user.click(card.getByRole("button", { name: "Send ACK failure" }));

    await waitFor(() =>
      expect(body).toEqual({
        deviceUid: "demo-device-4",
        configVersion: 8,
        errorMessage: "bad config",
      }),
    );
    expect(await screen.findByText(/bad config/)).toBeInTheDocument();
  });

  it("prevents anomaly submit when device UID is blank", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/scenarios/high-temperature`, () => {
        called = true;
        return HttpResponse.json({ scenario: "high-temperature" });
      }),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    const card = section("Alert anomaly scenarios");
    await user.clear(card.getByLabelText("Device UID"));
    await user.click(
      card.getByRole("button", { name: "Trigger high temperature" }),
    );

    expect(card.getByText("Device UID is required.")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("displays scenario error response", async () => {
    const user = userEvent.setup();
    server.use(
      statusHandler(),
      http.post(`${BASE_URL}/seed/scenarios/high-temperature`, () =>
        HttpResponse.json({ message: "device not found" }, { status: 404 }),
      ),
    );

    renderWithClient(<IotDemoToolsPage />, {
      route: "/admin/iot-demo-tools",
    });

    const card = section("Alert anomaly scenarios");
    await user.click(
      card.getByRole("button", { name: "Trigger high temperature" }),
    );

    expect(await screen.findByText(/device not found/)).toBeInTheDocument();
  });
});
