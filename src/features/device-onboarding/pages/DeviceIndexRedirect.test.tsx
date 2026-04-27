import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { DeviceIndexRedirect } from "./DeviceIndexRedirect";
import { renderWithClient } from "../../../test/render";

function LocationProbe() {
  const location = useLocation();
  return <div>Current path: {location.pathname}</div>;
}

const renderDeviceRoutes = (route: string) =>
  renderWithClient(
    <Routes>
      <Route path="/dashboard/devices" element={<DeviceIndexRedirect />} />
      <Route path="/dashboard/devices/onboarding" element={<LocationProbe />} />
      <Route
        path="/dashboard/devices/:deviceId"
        element={<div>Device detail route</div>}
      />
    </Routes>,
    { route },
  );

describe("device routes", () => {
  it("redirects the legacy device index to backend-driven onboarding", async () => {
    renderDeviceRoutes("/dashboard/devices");

    expect(
      await screen.findByText("Current path: /dashboard/devices/onboarding"),
    ).toBeInTheDocument();
  });

  it("keeps device detail routes reachable", () => {
    renderDeviceRoutes("/dashboard/devices/device-1");

    expect(screen.getByText("Device detail route")).toBeInTheDocument();
  });
});
